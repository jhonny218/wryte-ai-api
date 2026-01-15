/**
 * Test Fixtures - Sample Users
 */

export const mockUser = {
  id: 'user_test_123',
  clerkId: 'clerk_test_123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUserWithOrg = {
  ...mockUser,
  organizationMemberships: [
    {
      id: 'membership_123',
      organizationId: 'org_test_123',
      userId: 'user_test_123',
      role: 'OWNER',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

export const mockUsers = [
  mockUser,
  {
    id: 'user_test_456',
    clerkId: 'clerk_test_456',
    email: 'another@example.com',
    name: 'Another User',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];
