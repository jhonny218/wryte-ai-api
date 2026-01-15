/**
 * Test Helper Functions
 * Reusable utilities for testing
 */

import { Request } from 'express';
import supertest from 'supertest';

/**
 * Create a mock authenticated request
 */
export function mockAuthRequest(userId: string, body: any = {}): Partial<Request> {
  return {
    auth: { userId },
    body,
    params: {},
    query: {},
  } as Partial<Request>;
}

/**
 * Create mock Express response
 */
export function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Create mock Express next function
 */
export function mockNext() {
  return jest.fn();
}

/**
 * Helper to make authenticated API requests in integration tests
 */
export function authenticatedRequest(app: any, userId: string = 'test_user_123') {
  return {
    get: (url: string) => supertest(app).get(url).set('Authorization', `Bearer mock_token_${userId}`),
    post: (url: string) => supertest(app).post(url).set('Authorization', `Bearer mock_token_${userId}`),
    put: (url: string) => supertest(app).put(url).set('Authorization', `Bearer mock_token_${userId}`),
    patch: (url: string) => supertest(app).patch(url).set('Authorization', `Bearer mock_token_${userId}`),
    delete: (url: string) => supertest(app).delete(url).set('Authorization', `Bearer mock_token_${userId}`),
  };
}

/**
 * Wait for async operations (useful for worker tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate mock CUID (similar to Prisma's default)
 */
export function mockCuid(): string {
  return `test_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Assert that an error was thrown with specific message
 */
export function expectError(fn: () => any, message?: string) {
  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error: any) {
    if (message) {
      expect(error.message).toContain(message);
    }
    return error;
  }
}
