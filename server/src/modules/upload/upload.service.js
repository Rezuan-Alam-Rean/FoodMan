// upload config management and load-balanced image upload business logic
import UploadConfig from './uploadConfig.model.js';
import { ApiError } from '../../utils/apiError.js';

/**
 * create a new upload config entry
 * @param {object} payload - { name, uploadUrl, isActive }
 * @returns {object}
 */
export const createUploadConfig = async ({ name, uploadUrl, isActive }) => {
  if (!uploadUrl) {
    throw ApiError.badRequest('uploadUrl is required');
  }

  const existing = await UploadConfig.findOne({ uploadUrl: uploadUrl.trim() });
  if (existing) {
    throw ApiError.conflict('an upload config with this URL already exists');
  }

  const config = await UploadConfig.create({ name, uploadUrl, isActive });
  return config;
};

/**
 * get all upload configs with optional active filter
 * @param {object} queryParams
 * @returns {Array}
 */
export const getAllUploadConfigs = async ({ isActive } = {}) => {
  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  const configs = await UploadConfig.find(filter).sort({ load: 1, createdAt: 1 });
  return configs;
};

/**
 * get a single upload config by id
 * @param {string} configId
 * @returns {object}
 */
export const getUploadConfigById = async (configId) => {
  const config = await UploadConfig.findById(configId);
  if (!config) {
    throw ApiError.notFound('upload config not found');
  }
  return config;
};

/**
 * update an existing upload config
 * @param {string} configId
 * @param {object} payload - { name, uploadUrl, isActive }
 * @returns {object}
 */
export const updateUploadConfig = async (configId, { name, uploadUrl, isActive }) => {
  const config = await UploadConfig.findById(configId);
  if (!config) {
    throw ApiError.notFound('upload config not found');
  }

  // guard against duplicate URL if changing it
  if (uploadUrl && uploadUrl.trim() !== config.uploadUrl) {
    const duplicate = await UploadConfig.findOne({ uploadUrl: uploadUrl.trim() });
    if (duplicate) {
      throw ApiError.conflict('another upload config with this URL already exists');
    }
  }

  if (name !== undefined) config.name = name;
  if (uploadUrl !== undefined) config.uploadUrl = uploadUrl;
  if (isActive !== undefined) config.isActive = isActive;

  await config.save();
  return config;
};

/**
 * delete an upload config permanently
 * @param {string} configId
 */
export const deleteUploadConfig = async (configId) => {
  const config = await UploadConfig.findById(configId);
  if (!config) {
    throw ApiError.notFound('upload config not found');
  }
  await config.deleteOne();
};

/**
 * reset the load counter for an upload config back to zero
 * @param {string} configId
 * @returns {object}
 */
export const resetUploadConfigLoad = async (configId) => {
  const config = await UploadConfig.findByIdAndUpdate(
    configId,
    { load: 0 },
    { new: true, runValidators: true }
  );
  if (!config) {
    throw ApiError.notFound('upload config not found');
  }
  return config;
};


/**
 * upload an image via the cloudinary SDK (for cloudinary:// connection URLs)
 * @param {object} config - UploadConfig document
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 */
const uploadViaCloudinarySdk = async (config, fileBuffer, mimetype) => {
  const { v2: cloudinary } = await import('cloudinary');

  // parse cloudinary://api_key:api_secret@cloud_name
  const url = new URL(config.uploadUrl);
  cloudinary.config({
    cloud_name: url.host,          // everything after @
    api_key: url.username,
    api_secret: url.password,
  });

  const base64DataUri = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64DataUri, {
    resource_type: 'image',
  });

  return { url: result.secure_url, public_id: result.public_id };
};

/**
 * upload an image to a plain HTTPS cloudinary upload endpoint
 * (e.g. https://api.cloudinary.com/v1_1/{cloud}/image/upload?upload_preset=xxx)
 * @param {object} config - UploadConfig document
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 */
const uploadViaHttpEndpoint = async (config, fileBuffer, mimetype) => {
  const base64DataUri = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
  const formData = new FormData();
  formData.append('file', base64DataUri);

  let response;
  try {
    response = await fetch(config.uploadUrl, { method: 'POST', body: formData });
  } catch {
    throw ApiError.serviceUnavailable('failed to reach upload endpoint — check network connectivity');
  }

  if (!response.ok) {
    let errMessage = 'image upload failed';
    try {
      const errBody = await response.json();
      errMessage = errBody?.error?.message || errMessage;
    } catch { /* ignore */ }
    throw ApiError.internal(errMessage);
  }

  const data = await response.json();
  return { url: data.secure_url, public_id: data.public_id };
};

/**
 * upload an image to the active cloudinary endpoint with the lowest load.
 * auto-detects cloudinary:// connection strings vs plain HTTPS upload URLs.
 * @param {Buffer} fileBuffer - raw file buffer from multer
 * @param {string} mimetype  - e.g. "image/jpeg"
 * @returns {{ url: string, public_id: string }}
 */
export const uploadImageToCloudinary = async (fileBuffer, mimetype) => {
  // pick the least-loaded active endpoint
  const config = await UploadConfig.findOne({ isActive: true }).sort({ load: 1 });
  if (!config) {
    throw ApiError.serviceUnavailable('no active upload endpoints are available');
  }

  const isCloudinaryScheme = config.uploadUrl.startsWith('cloudinary://');

  const result = isCloudinaryScheme
    ? await uploadViaCloudinarySdk(config, fileBuffer, mimetype)
    : await uploadViaHttpEndpoint(config, fileBuffer, mimetype);

  // increment load on the used config atomically
  await UploadConfig.findByIdAndUpdate(config._id, { $inc: { load: 1 } });

  return result;
};
