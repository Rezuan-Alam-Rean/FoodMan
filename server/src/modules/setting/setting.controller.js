// system settings controller handlers
import { getPublicSystemSettings, updateSystemSettings } from './setting.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetSystemSettings = catchAsync(async (req, res) => {
  const settings = await getPublicSystemSettings();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'system settings retrieved successfully',
    data: settings,
  });
});

export const handleUpdateSystemSettings = catchAsync(async (req, res) => {
  const updatedSettings = await updateSystemSettings(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'system settings updated successfully',
    data: updatedSettings,
  });
});
