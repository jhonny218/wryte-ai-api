# End-to-End Testing with Playwright

This document describes the E2E testing infrastructure for the Wryte AI API.

## Overview

The E2E test suite uses Playwright for API testing with:

- **Real database** (PostgreSQL test instance)
- **Real Redis** (with worker-specific key isolation)
- **Mock AI service** (deterministic responses)
- **Auth bypass** (no Clerk dependency)
- **Parallel execution** (4 workers with transaction isolation)

## Prerequisites

1. **Neon database** (or PostgreSQL) with test database created
2. Redis running locally (or use Upstash)
3. Node.js dependencies installed

## Setup

### 1. Create Test Database

**Option A: Using Neon (Recommended)**

1. Create a new database in your Neon project for testing (e.g., `wryte_ai_test`)
2. Copy the connection string from Neon dashboard
3. Update `DATABASE_URL` in `.env.test` with your Neon test database URL

```bash
# .env.test
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/wryte_ai_test?sslmode=require
```

4. Run the setup script:

```bash
npm run test:db:setup
```

**Option B: Using Local PostgreSQL**

If you have PostgreSQL installed locally, the script will work automatically.

This script will:

- Reset the test database (drop all tables)
- Run all Prisma migrations
- Verify connection

### 2. Configure Environment

Update `.env.test` with your Neon test database URL:

```env
# Database - Use your Neon test database
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/wryte_ai_test?sslmode=require

# Redis - Local or Upstash
REDIS_URL=redis://localhost:6379
```

Key settings:

- `DATABASE_URL`: Your Neon test database connection string
- `NODE_ENV=test`: Enables test mode
- `RUN_WORKERS=true`: Runs BullMQ workers in-process
- `GEMINI_SERVICE_TYPE=mock`: Uses mock AI service

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run with UI (interactive mode)

```bash
npm run test:e2e:ui
```

### Run in debug mode

```bash
npm run test:e2e:debug
```

### Run with browser visible

```bash
npm run test:e2e:headed
```

### Run specific test file

```bash
npx playwright test health.spec.ts
```

### Run tests matching pattern

```bash
npx playwright test --grep "authentication"
```

## Test Structure

```
src/tests/e2e/
├── setup/
│   ├── database.ts          # Database connection & transaction helpers
│   ├── redis.ts             # Redis with worker isolation
│   ├── test-server.ts       # Express server for testing
│   ├── global-setup.ts      # Runs before all tests
│   └── global-teardown.ts   # Runs after all tests
├── helpers/
│   ├── auth-bypass.ts       # Authentication utilities
│   └── wait-for-job.ts      # Async job polling helpers
├── mocks/
│   └── gemini-mock.ts       # Mock AI service
├── fixtures/
│   └── index.ts             # Test data factories
└── specs/
    ├── health.spec.ts       # Health check tests
    ├── auth.spec.ts         # Authentication tests
    ├── users.spec.ts        # User CRUD tests
    ├── organizations.spec.ts # Organization tests
    ├── calendar.spec.ts     # Calendar tests
    └── workflows/           # Multi-step workflow tests
        ├── title-generation.spec.ts
        ├── outline-generation.spec.ts
        ├── blog-generation.spec.ts
        └── full-pipeline.spec.ts
```

## Writing Tests

### Basic API Test

```typescript
import { test, expect } from "@playwright/test";

test.describe("My Feature", () => {
  test.describe.configure({ mode: "parallel" });

  test("should do something", async ({ request }) => {
    const response = await request.get("/api/v1/endpoint");

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("data");
  });
});
```

### Authenticated Test

```typescript
import {
  createAuthenticatedContext,
  createTestUser,
} from "../helpers/auth-bypass";
import { getTestPrismaClient } from "../setup/database";

test("should access protected resource", async ({ request }) => {
  const prisma = getTestPrismaClient();
  const user = await createTestUser(prisma);
  const headers = createAuthenticatedContext(user.clerkId);

  const response = await request.get("/api/v1/users/me", { headers });
  expect(response.ok()).toBeTruthy();
});
```

### Async Job Test

```typescript
import { waitForJobCompletion } from "../helpers/wait-for-job";

test.slow(); // Mark as slow test (3x timeout)

test("should complete async job", async ({ request }) => {
  // Create job
  const response = await request.post("/api/v1/jobs/title", {
    data: {
      /* job data */
    },
    headers,
  });
  const { jobId } = await response.json();

  // Wait for completion
  const job = await waitForJobCompletion(request, jobId, {
    timeout: 15000, // 15 seconds
  });

  expect(job.status).toBe("COMPLETED");
  expect(job.result).toBeDefined();
});
```

### Serial Workflow Test

```typescript
test.describe("Multi-step workflow", () => {
  test.describe.configure({ mode: "serial", retries: 3 });

  test("step 1: create organization", async ({ request }) => {
    // Test step 1
  });

  test("step 2: generate titles", async ({ request }) => {
    // Test step 2 (depends on step 1)
  });

  test("step 3: create outline", async ({ request }) => {
    // Test step 3 (depends on step 2)
  });
});
```

## Architecture Details

### Database Isolation

Each test runs in a transaction that automatically rolls back:

- Fast cleanup (no manual deletion)
- Perfect isolation between tests
- Parallel execution safe

### Redis Isolation

Each Playwright worker gets a unique key prefix:

- Worker 0: `test:w0:*`
- Worker 1: `test:w1:*`
- Worker 2: `test:w2:*`
- Worker 3: `test:w3:*`

BullMQ queues are also worker-specific to prevent job collisions.

### Connection Pool

Configured for parallel execution:

- Pool size: 10 connections (4 workers × 2.5)
- Pool timeout: 10 seconds
- Automatic connection monitoring in debug mode

### Retry Strategy

- Global retries: 2 (all tests)
- Workflow tests: 3 retries (async jobs can be flaky)
- Slow tests: 3x timeout multiplier

## Troubleshooting

### Test Database Issues

```bash
# Reset test database
npm run test:db:setup

# Manually verify connection (requires Neon CLI or psql)
# Or check in Neon dashboard at https://console.neon.tech
```

### Port Already in Use

If port 3001 is busy:

```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Worker Timeout Issues

If async jobs timeout:

1. Check `RUN_WORKERS=true` in `.env.test`
2. Increase timeout in test:
   ```typescript
   await waitForJobCompletion(request, jobId, { timeout: 30000 });
   ```
3. Check Redis connection
4. Enable debug logging: `DEBUG=true` in `.env.test`

### Connection Pool Exhaustion

If seeing "too many connections":

1. Enable debug mode to see pool stats
2. Reduce parallel workers in `playwright.config.ts`
3. Increase pool size in database connection config

## CI/CD Integration

The test suite is designed for CI environments:

```yaml
# Example GitHub Actions
- name: Setup Test Database
  run: npm run test:db:setup

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true
```

In CI:

- Uses 2 workers (vs 4 locally)
- Retries enabled by default
- JUnit report generated for CI dashboards

## Best Practices

1. **Use transactions**: Let automatic rollback handle cleanup
2. **Mark slow tests**: Use `test.slow()` for async jobs
3. **Parallel by default**: Only use serial for dependent steps
4. **Meaningful assertions**: Check status AND response body
5. **Clean test data**: Use unique identifiers (timestamps, UUIDs)
6. **Debug mode**: Enable `DEBUG=true` when developing tests
7. **Retry wisely**: Don't overuse retries to mask real issues

## Performance

Typical test suite execution:

- Health checks: ~50-100ms per test
- API CRUD: ~200-500ms per test
- Async jobs: ~2-5 seconds per test (with workers)
- Full pipeline: ~10-15 seconds

With 4 parallel workers:

- ~50 tests complete in 10-20 seconds
- Database transactions are fast (no disk I/O for rollback)
- Redis key isolation prevents conflicts
