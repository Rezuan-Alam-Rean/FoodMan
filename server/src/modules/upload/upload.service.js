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
 * upload an image to the active cloudinary endpoint with the lowest load.
 * the file is sent as a base64 data URI — no cloudinary sdk or env keys needed.
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

  // encode buffer as base64 data URI (cloudinary accepts this format)
  const base64DataUri = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;

  const formData = new FormData();
  formData.append('file', base64DataUri);

  let response;
  try {
    response = await fetch(config.uploadUrl, {
      method: 'POST',
      body: formData,
    });
  } catch (networkError) {
    throw ApiError.serviceUnavailable('failed to reach upload endpoint — check network connectivity');
  }

  if (!response.ok) {
    let errMessage = 'image upload failed';
    try {
      const errBody = await response.json();
      errMessage = errBody?.error?.message || errMessage;
    } catch {
      // ignore json parse failure on error response
    }
    throw ApiError.internal(errMessage);
  }

  const data = await response.json();

  // increment load on the used config atomically
  await UploadConfig.findByIdAndUpdate(config._id, { $inc: { load: 1 } });

  return {
    url: data.secure_url,
    public_id: data.public_id,
  };
};
