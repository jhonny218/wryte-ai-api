// Test configuration for Prisma - loads .env.test instead of .env
import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig, env } from "prisma/config";

// Load test environment variables
config({ path: resolve(__dirname, ".env.test") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
