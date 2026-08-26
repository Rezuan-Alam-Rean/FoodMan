import { checkHealth } from './health.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const getHealth = catchAsync(async (req, res) => {
  const healthData = await checkHealth();
  const isHealthy = healthData.status === 'OK';

  const statusCode = isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
  const message = isHealthy
    ? 'System is healthy and database is connected'
    : 'System is running with degraded dependencies';

  return ApiResponse.success(res, {
    statusCode,
    message,
    data: healthData,
  });
});
