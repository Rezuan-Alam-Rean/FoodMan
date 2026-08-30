// environment variable configuration and validation schema
import dotenv from 'dotenv';
import { z } from 'zod';
import { NODE_ENVS } from '../constants/index.js';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum([NODE_ENVS.DEVELOPMENT, NODE_ENVS.PRODUCTION, NODE_ENVS.TEST])
    .default(NODE_ENVS.DEVELOPMENT),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z
    .string()
    .min(1, 'MONGO_URI is required')
    .default('mongodb://localhost:27017/foodman'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .default('foodman-super-secret-jwt-key-2026-production-ready'),
  JWT_EXPIRES_IN: z.string().default('30d'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
