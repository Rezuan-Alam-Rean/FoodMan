import { pingDatabase } from '../../config/db.js';
import { env } from '../../config/env.js';

export const checkHealth = async () => {
  const dbHealth = await pingDatabase();
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbHealth.status === 'healthy';

  return {
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: env.NODE_ENV,
    services: {
      server: {
        status: 'healthy',
        nodeVersion: process.version,
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        },
      },
      database: dbHealth,
    },
  };
};
