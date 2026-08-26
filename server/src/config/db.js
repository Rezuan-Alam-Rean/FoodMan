import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { DB_CONNECTION_STATES } from '../constants/index.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    // do not terminate process immediately in development so server can still serve health check
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error(`Error disconnecting MongoDB: ${error.message}`);
  }
};

export const pingDatabase = async () => {
  const readyStateCode = mongoose.connection.readyState;
  const stateName = DB_CONNECTION_STATES[readyStateCode] || 'unknown';

  if (readyStateCode !== 1 || !mongoose.connection.db) {
    return {
      status: 'unhealthy',
      connected: false,
      state: stateName,
      latencyMs: null,
      error: readyStateCode === 0 ? 'Database is disconnected' : `Database state is ${stateName}`,
    };
  }

  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - start;

    return {
      status: 'healthy',
      connected: true,
      state: stateName,
      latencyMs,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      state: stateName,
      latencyMs: null,
      error: error.message,
    };
  }
};

// listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});
