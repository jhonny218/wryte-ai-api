/**
 * Test Fixtures - Sample Organizations
 */

export const mockOrganization = {
  id: 'org_test_123',
  name: 'Test Organization',
  slug: 'test-organization',
  mission: 'To test everything thoroughly',
  description: 'A test organization for running tests',
  websiteUrl: 'https://test.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockOrganizationWithSettings = {
  ...mockOrganization,
  contentSettings: {
    id: 'settings_123',
    organizationId: 'org_test_123',
    primaryKeywords: ['productivity', 'wellness', 'mindfulness'],
    secondaryKeywords: ['meditation', 'sleep', 'stress management', 'self-care'],
    postingDaysOfWeek: ['MON', 'WED', 'FRI'],
    tone: 'warm and professional',
    targetAudience: 'wellness-focused professionals',
    industry: 'Health & Wellness',
    goals: ['Engagement', 'Brand Awareness'],
    competitorUrls: ['https://competitor.com'],
    topicsToAvoid: ['politics', 'religion'],
    preferredLength: 'MEDIUM_FORM',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const mockOrganizations = [
  mockOrganization,
  {
    id: 'org_test_456',
    name: 'Another Test Org',
    slug: 'another-test-org',
    mission: 'Testing more things',
    description: 'Another test organization',
    websiteUrl: 'https://another-test.com',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];
