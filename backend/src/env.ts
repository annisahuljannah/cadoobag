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
  // JWT Configuration
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  // Email Configuration
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@cadoobag.com'),
  SMTP_FROM_NAME: z.string().default('Cadoobag'),
  // Upload Configuration
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'),
});

export const env = envSchema.parse(process.env);
