/**
 * Test Fixtures - Mock AI Responses
 * Sample responses from Gemini API for testing
 */

// Mock title generation response
export const mockTitleGenerationResponse = `[
  "10 Science-Backed Ways to Reduce Stress Naturally",
  "The Ultimate Guide to Mindful Morning Routines",
  "How to Build a Sustainable Meditation Practice",
  "Transform Your Sleep: 7 Evidence-Based Strategies",
  "Understanding Your Body's Natural Rhythms for Better Health",
  "The Connection Between Gut Health and Mental Wellness",
  "Simple Breathwork Techniques for Instant Calm",
  "Creating a Personal Wellness Sanctuary at Home"
]`;

// Mock outline generation response
export const mockOutlineGenerationResponse = `{
  "title": "10 Science-Backed Ways to Reduce Stress Naturally",
  "metaDescription": "Discover 10 proven, natural methods to reduce stress and boost your mental wellness. Evidence-based strategies you can start today.",
  "seoKeywords": [
    "stress reduction techniques",
    "natural stress relief",
    "science-backed wellness",
    "mindfulness practices",
    "mental health strategies"
  ],
  "structure": {
    "introduction": {
      "summary": "Feeling overwhelmed by daily stressors? You're not alone. This guide reveals 10 scientifically-proven techniques to naturally reduce stress and reclaim your peace of mind.",
      "keyPoints": [
        "Understanding the science of stress",
        "Evidence-based natural solutions",
        "Practical, actionable strategies",
        "Long-term stress management",
        "Sustainable wellness habits"
      ]
    },
    "sections": [
      {
        "heading": "Understanding Stress: The Science Behind Your Response",
        "subheadings": [
          "What Happens in Your Body During Stress",
          "The Difference Between Acute and Chronic Stress",
          "Why Natural Solutions Are Effective"
        ],
        "points": [
          "Cortisol and the stress response",
          "Physical and mental symptoms",
          "The importance of holistic approaches",
          "Setting the foundation for change"
        ]
      },
      {
        "heading": "Mindful Breathing: Your First Line of Defense",
        "subheadings": [
          "The 4-7-8 Breathing Technique",
          "Box Breathing for Instant Calm",
          "When and How to Practice"
        ],
        "points": [
          "Step-by-step breathing instructions",
          "Scientific backing for breathwork",
          "Best times to practice",
          "Making it a daily habit"
        ]
      }
    ],
    "conclusion": {
      "summary": "By incorporating these 10 science-backed techniques into your daily routine, you'll build resilience against stress and cultivate lasting wellness. Start small, be consistent, and watch your stress levels transform.",
      "cta": "Ready to dive deeper? Download our free Stress Reduction Toolkit with guided practices and tracking sheets."
    }
  },
  "suggestedImages": [
    "Person practicing deep breathing outdoors",
    "Infographic showing the stress response cycle",
    "Peaceful meditation space setup",
    "Nature scene promoting calm",
    "Person journaling with tea"
  ]
}`;

// Mock blog generation response
export const mockBlogGenerationResponse = `{
  "content": "# 10 Science-Backed Ways to Reduce Stress Naturally\\n\\nFeeling overwhelmed by daily stressors? You're not alone...\\n\\n## Understanding Stress: The Science Behind Your Response\\n\\nStress is more than just a feeling...",
  "wordCount": 1850
}`;

// Mock malformed AI response (for testing error handling)
export const mockMalformedAIResponse = `Here are some titles:
1. Title One
2. Title Two
3. Title Three`;

// Mock empty AI response
export const mockEmptyAIResponse = ``;

// Mock AI error response
export const mockAIErrorResponse = {
  error: {
    code: 503,
    message: 'The model is overloaded. Please try again later.',
    status: 'UNAVAILABLE',
  },
};
