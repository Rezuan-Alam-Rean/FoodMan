import {
  getMyWalletStatement,
  getAllPartnerWallets,
  getTreasurySummary,
} from './wallet.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetMyWallet = catchAsync(async (req, res) => {
  const statement = await getMyWalletStatement(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'wallet statement retrieved successfully',
    data: statement,
  });
});

export const handleGetAllWallets = catchAsync(async (req, res) => {
  const wallets = await getAllPartnerWallets();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'all partner wallets retrieved successfully',
    data: wallets,
  });
});

export const handleGetTreasurySummary = catchAsync(async (req, res) => {
  const summary = await getTreasurySummary();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'treasury summary retrieved successfully',
    data: summary,
  });
});
