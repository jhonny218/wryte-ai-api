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

  // OpenAI
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),

  // Frontend
  FRONTEND_URL: z.url(),

  // Optional
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
