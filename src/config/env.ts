import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  // Database
  DATABASE_URL: z.url(),

  // Redis
  REDIS_URL: z.url(),

  // Clerk
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),

  // Gemini
  GEMINI_API_KEY: z.string(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Frontend
  FRONTEND_URL: z.url(),

  // Optional
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  RUN_WORKERS: z.string().default('false').transform(val => val === 'true'),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
