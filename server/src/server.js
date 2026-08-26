import app from './app.js';
import { env, connectDB, disconnectDB } from './config/index.js';
import { logger } from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    // connect to mongodb
    await connectDB();

    // start http server
    server = app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`Health check available at http://localhost:${env.PORT}/health and http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// handle process termination and unexpected errors
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
