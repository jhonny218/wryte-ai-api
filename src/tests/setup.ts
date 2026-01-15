/**
 * Jest Global Setup
 * Runs once before all tests
 */

// Extend Jest matchers if needed
// import '@testing-library/jest-dom';

// Global test timeout (30 seconds for integration tests)
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence console in tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep errors visible
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CLERK_SECRET_KEY = 'test_clerk_secret';
process.env.GEMINI_API_KEY = 'test_gemini_key';
process.env.FRONTEND_URL = 'http://localhost:3001';

// Clean up after all tests
afterAll(async () => {
  // Close database connections, etc.
  // Note: Prisma mock cleanup happens automatically via jest.clearAllMocks()
});
