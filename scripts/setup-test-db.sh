#!/bin/bash

# Exit on error
set -e

echo "🗄️  Setting up test database..."

# Check if .env.test exists
if [ ! -f .env.test ]; then
  echo "❌ Error: .env.test not found"
  echo "   Please create .env.test with your Neon test database URL"
  exit 1
fi

# Load test environment
export $(cat .env.test | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env.test"
  exit 1
fi

echo "Using database: $DATABASE_URL"

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate --config prisma.config.test.ts

# Reset database using Prisma with test config
echo "Resetting database schema..."
npx prisma migrate reset --force --config prisma.config.test.ts

echo "✅ Test database setup complete!"
echo "   All migrations applied to Neon database"
