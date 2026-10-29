import 'dotenv/config'
import { z } from 'zod'

const testDatabaseUrl = 'postgresql://test:test@127.0.0.1:5432/torcly_test'
const databaseUrl = z
  .string()
  .refine(
    (value) =>
      value.startsWith('postgresql://') || value.startsWith('postgres://'),
    'Debe ser una URL de PostgreSQL',
  )

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(z.url()).min(1)),
  DATABASE_URL: databaseUrl,
  DIRECT_URL: databaseUrl,
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(20).default(8),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  SESSION_COOKIE_NAME: z.string().min(1).default('torcly_session'),
  SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().min(1).max(24).default(8),
  SESSION_ACTIVITY_REFRESH_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(30)
    .default(5),
  SESSION_AUTH_CACHE_SECONDS: z.coerce
    .number()
    .int()
    .min(5)
    .max(300)
    .default(60),
  SESSION_TOKEN_RENEWAL_HOURS: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .default(4),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  PASSWORD_RESET_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(1440)
    .default(30),
  GROQ_API_KEY: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(1).optional(),
  ),
  AI_PROVIDER: z.enum(['groq', 'fake']).optional(),
  GROQ_MODEL: z.string().min(1).max(120).default('openai/gpt-oss-20b'),
  AI_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30000)
    .default(10000),
  AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(100).default(10),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(1000).default(350),
})

const isTest = process.env.NODE_ENV === 'test'

export const env = schema.parse({
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ?? (isTest ? testDatabaseUrl : undefined),
  DIRECT_URL: process.env.DIRECT_URL ?? (isTest ? testDatabaseUrl : undefined),
})
