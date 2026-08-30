// rider cod remittance controller handlers
import {
  submitRiderRemittance,
  getMyRemittances,
  getAdminRemittances,
  verifyRiderRemittance,
} from './remittance.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleSubmitRemittance = catchAsync(async (req, res) => {
  const remittance = await submitRiderRemittance(req.user._id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'remittance submitted for admin verification',
    data: remittance,
  });
});

export const handleGetMyRemittances = catchAsync(async (req, res) => {
  const remittances = await getMyRemittances(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'remittance history retrieved successfully',
    data: remittances,
  });
});

export const handleGetAdminRemittances = catchAsync(async (req, res) => {
  const remittances = await getAdminRemittances(req.query.status);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'remittances retrieved successfully',
    data: remittances,
  });
});

export const handleVerifyRemittance = catchAsync(async (req, res) => {
  const remittance = await verifyRiderRemittance(
    req.params.id,
    req.body.status,
    req.body.admin_notes,
    req.user._id
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `remittance ${String(remittance.status).toLowerCase()} successfully`,
    data: remittance,
  });
});
