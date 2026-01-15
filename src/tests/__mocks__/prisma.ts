/**
 * Prisma Client Mock
 * 
 * This mock replaces the real Prisma client in tests.
 * Use jest-mock-extended for better TypeScript support.
 */

import { PrismaClient } from '../../../generated/prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset mock between tests
beforeEach(() => {
  mockReset(prismaMock);
});

// Export as singleton (mimics real prisma.ts)
export const prisma = prismaMock;
export default prismaMock;
