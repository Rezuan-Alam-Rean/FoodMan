// delivery zone controller handlers
import {
  getAllActiveZones,
  createZone,
  updateZone,
  createSubzone,
  updateSubzone,
} from './zone.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetZones = catchAsync(async (req, res) => {
  const zones = await getAllActiveZones();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'zones and subzones retrieved successfully',
    data: zones,
  });
});

export const handleCreateZone = catchAsync(async (req, res) => {
  const zone = await createZone(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'zone created successfully',
    data: zone,
  });
});

export const handleUpdateZone = catchAsync(async (req, res) => {
  const zone = await updateZone(req.params.id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'zone updated successfully',
    data: zone,
  });
});

export const handleCreateSubzone = catchAsync(async (req, res) => {
  const subzone = await createSubzone(req.params.zoneId, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'subzone created successfully',
    data: subzone,
  });
});

export const handleUpdateSubzone = catchAsync(async (req, res) => {
  const subzone = await updateSubzone(req.params.subzoneId, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'subzone updated successfully',
    data: subzone,
  });
});
