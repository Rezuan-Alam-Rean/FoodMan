// admin control tower controller handlers
import {
  getAdminDeskMetricCounts,
  getPendingMfsPayments,
  verifyManualMfsPayment,
} from './adminDesk.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetAdminDeskCounts = catchAsync(async (req, res) => {
  const counts = await getAdminDeskMetricCounts();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'admin desk counts retrieved successfully',
    data: counts,
  });
});

export const handleGetPendingMfsPayments = catchAsync(async (req, res) => {
  const payments = await getPendingMfsPayments();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'pending mfs payments retrieved successfully',
    data: payments,
  });
});

export const handleVerifyMfsPayment = catchAsync(async (req, res) => {
  const result = await verifyManualMfsPayment(
    req.params.paymentId,
    req.body.status,
    req.user._id,
    req.body.notes
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `payment ${req.body.status.toLowerCase()} successfully`,
    data: result,
  });
});
