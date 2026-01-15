/**
 * Clerk Authentication Mock
 * 
 * Mocks Clerk's auth middleware for testing
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Mock Clerk auth middleware
 * Simulates authenticated requests
 */
export const mockClerkMiddleware = (userId: string = 'test_user_123') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Type assertion to bypass complex Clerk types in tests
    (req as any).auth = { userId };
    next();
  };
};

/**
 * Mock getAuth function
 */
export const getAuth = jest.fn((req: Request) => {
  return { userId: (req as any).auth?.userId || null };
});

/**
 * Mock ClerkExpressWithAuth
 */
export const ClerkExpressWithAuth = jest.fn(() => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract userId from Authorization header (format: Bearer mock_token_<userId>)
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer mock_token_(.+)/);
    const userId = match ? match[1] : null;
    
    // Type assertion to bypass complex Clerk types in tests
    (req as any).auth = { userId: userId || 'test_user_123' };
    next();
  };
});

// Mock the entire @clerk/express module
jest.mock('@clerk/express', () => ({
  ClerkExpressWithAuth,
  getAuth,
}));
