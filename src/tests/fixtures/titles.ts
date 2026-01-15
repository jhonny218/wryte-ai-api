/**
 * Test Fixtures - Sample Blog Titles
 */

export const mockBlogTitle = {
  id: 'title_test_123',
  organizationId: 'org_test_123',
  title: '10 Science-Backed Ways to Reduce Stress Naturally',
  status: 'PENDING' as const,
  scheduledDate: new Date('2024-02-01'),
  aiGenerationContext: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockApprovedBlogTitle = {
  ...mockBlogTitle,
  id: 'title_test_456',
  status: 'APPROVED' as const,
  title: 'The Ultimate Guide to Mindful Morning Routines',
};

export const mockBlogTitles = [
  '10 Science-Backed Ways to Reduce Stress Naturally',
  'The Ultimate Guide to Mindful Morning Routines',
  'How to Build a Sustainable Meditation Practice',
  'Transform Your Sleep: 7 Evidence-Based Strategies',
  'Understanding Your Body\'s Natural Rhythms for Better Health',
  'The Connection Between Gut Health and Mental Wellness',
  'Simple Breathwork Techniques for Instant Calm',
  'Creating a Personal Wellness Sanctuary at Home',
];

export const mockTitleWithOutline = {
  ...mockBlogTitle,
  outline: {
    id: 'outline_test_123',
    blogTitleId: 'title_test_123',
    structure: {
      introduction: {
        summary: 'Discover evidence-based stress reduction techniques',
        keyPoints: ['Understanding stress', 'Natural solutions', 'Practical applications'],
      },
      sections: [
        {
          heading: 'Understanding Stress and Its Impact',
          subheadings: ['What is stress?', 'How stress affects your body'],
          points: ['Physical symptoms', 'Mental effects', 'Long-term consequences'],
        },
      ],
      conclusion: {
        summary: 'Integrate these practices into your daily life',
        cta: 'Start your stress-free journey today',
      },
    },
    seoKeywords: ['stress reduction', 'natural wellness', 'mindfulness'],
    metaDescription: 'Discover 10 science-backed ways to naturally reduce stress and improve your wellbeing.',
    suggestedImages: ['Person meditating', 'Nature scene', 'Peaceful workspace'],
    status: 'PENDING' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};
