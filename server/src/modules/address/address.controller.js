// user address controller handlers
import {
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from './address.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetMyAddresses = catchAsync(async (req, res) => {
  const addresses = await getUserAddresses(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'saved addresses retrieved successfully',
    data: addresses,
  });
});

export const handleCreateAddress = catchAsync(async (req, res) => {
  const address = await createUserAddress(req.user._id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'address saved successfully',
    data: address,
  });
});

export const handleUpdateAddress = catchAsync(async (req, res) => {
  const address = await updateUserAddress(req.user._id, req.params.id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'address updated successfully',
    data: address,
  });
});

export const handleDeleteAddress = catchAsync(async (req, res) => {
  await deleteUserAddress(req.user._id, req.params.id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'address deleted successfully',
    data: null,
  });
});
