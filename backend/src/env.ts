import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  RAJAONGKIR_API_KEY: z.string(),
  RAJAONGKIR_BASE_URL: z.string(),
  TRIPAY_API_KEY: z.string(),
  TRIPAY_PRIVATE_KEY: z.string(),
  TRIPAY_MERCHANT_CODE: z.string(),
  TRIPAY_BASE_URL: z.string(),
  FRONTEND_BASE_URL: z.string(),
  BACKEND_BASE_URL: z.string(),
  JWT_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'),
});

export const env = envSchema.parse(process.env);
