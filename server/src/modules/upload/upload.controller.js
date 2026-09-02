// upload module controller handlers
import {
  createUploadConfig,
  getAllUploadConfigs,
  getUploadConfigById,
  updateUploadConfig,
  deleteUploadConfig,
  resetUploadConfigLoad,
  uploadImageToCloudinary,
} from './upload.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleCreateUploadConfig = catchAsync(async (req, res) => {
  const config = await createUploadConfig(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'upload config created successfully',
    data: config,
  });
});

export const handleGetAllUploadConfigs = catchAsync(async (req, res) => {
  const configs = await getAllUploadConfigs(req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'upload configs retrieved successfully',
    data: configs,
  });
});

export const handleGetUploadConfigById = catchAsync(async (req, res) => {
  const config = await getUploadConfigById(req.params.configId);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'upload config retrieved successfully',
    data: config,
  });
});

export const handleUpdateUploadConfig = catchAsync(async (req, res) => {
  const config = await updateUploadConfig(req.params.configId, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'upload config updated successfully',
    data: config,
  });
});

export const handleDeleteUploadConfig = catchAsync(async (req, res) => {
  await deleteUploadConfig(req.params.configId);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'upload config deleted successfully',
    data: null,
  });
});

export const handleResetUploadConfigLoad = catchAsync(async (req, res) => {
  const config = await resetUploadConfigLoad(req.params.configId);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'upload config load reset to zero',
    data: config,
  });
});

// ─── Image upload (authenticated users) ─────────────────────────────────────

export const handleUploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('no image file provided — use the "image" field in form-data');
  }

  const result = await uploadImageToCloudinary(req.file.buffer, req.file.mimetype);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'image uploaded successfully',
    data: result,
  });
});
