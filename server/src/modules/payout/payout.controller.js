// admin payout settlement controller handlers
import { disburseManualPayout, getPayoutSettlementHistory } from './payout.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleDisbursePayout = catchAsync(async (req, res) => {
  const payout = await disburseManualPayout(req.body, req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'payout settlement recorded and wallet debited successfully',
    data: payout,
  });
});

export const handleGetPayoutHistory = catchAsync(async (req, res) => {
  const payouts = await getPayoutSettlementHistory();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'payout history retrieved successfully',
    data: payouts,
  });
});
