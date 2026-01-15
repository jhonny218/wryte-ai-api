import { PromptService } from '../../../../services/ai/prompt.service';
import { ContentSettings } from '../../../../../generated/prisma/client';

describe('PromptService', () => {
  let promptService: PromptService;

  const mockSettings: Partial<ContentSettings> = {
    primaryKeywords: ['wellness', 'health'],
    secondaryKeywords: ['nutrition', 'fitness', 'mindfulness'],
    tone: 'warm and expert',
    targetAudience: 'health-conscious professionals',
    industry: 'wellness',
    goals: ['engagement', 'education'],
    competitorUrls: ['https://competitor1.com', 'https://competitor2.com'],
    topicsToAvoid: ['politics', 'religion'],
    preferredLength: 'MEDIUM',
  };

  beforeEach(() => {
    promptService = new PromptService();
  });

  describe('generateTitlePrompt', () => {
    it('should generate a prompt with all settings', () => {
      const result = promptService.generateTitlePrompt(
        mockSettings as ContentSettings,
        5
      );

      expect(result).toContain('Generate 5 unique');
      expect(result).toContain('wellness, health');
      expect(result).toContain('nutrition, fitness, mindfulness');
      expect(result).toContain('warm and expert');
      expect(result).toContain('health-conscious professionals');
      expect(result).toContain('wellness');
      expect(result).toContain('engagement, education');
      expect(result).toContain('https://competitor1.com, https://competitor2.com');
      expect(result).toContain('politics, religion');
      expect(result).toContain('40–70 characters');
    });

    it('should handle empty arrays with defaults', () => {
      const emptySettings: Partial<ContentSettings> = {
        primaryKeywords: [],
        secondaryKeywords: [],
        goals: [],
        competitorUrls: [],
        topicsToAvoid: [],
      };

      const result = promptService.generateTitlePrompt(
        emptySettings as ContentSettings,
        3
      );

      expect(result).toContain('None');
      expect(result).toContain('Engagement and education');
      expect(result).toContain('None explicitly specified');
      expect(result).toContain('None specified');
    });

    it('should use SHORT_FORM length guidance', () => {
      const settings = { ...mockSettings, preferredLength: 'SHORT_FORM' };

      const result = promptService.generateTitlePrompt(
        settings as ContentSettings,
        5
      );

      expect(result).toContain('30–55 characters');
    });

    it('should use LONG_FORM length guidance', () => {
      const settings = { ...mockSettings, preferredLength: 'LONG_FORM' };

      const result = promptService.generateTitlePrompt(
        settings as ContentSettings,
        5
      );

      expect(result).toContain('50–80 characters');
    });

    it('should include seasonal context when provided', () => {
      const result = promptService.generateTitlePrompt(
        mockSettings as ContentSettings,
        5,
        'January 2024'
      );

      expect(result).toContain('January 2024');
      expect(result).toContain('seasonal themes');
    });

    it('should not include seasonal context when not provided', () => {
      const result = promptService.generateTitlePrompt(
        mockSettings as ContentSettings,
        5
      );

      expect(result).not.toContain('seasonal themes');
    });

    it('should request JSON array format', () => {
      const result = promptService.generateTitlePrompt(
        mockSettings as ContentSettings,
        5
      );

      expect(result).toContain('valid JSON array');
      expect(result).toContain('["Title 1", "Title 2", "Title 3"]');
    });
  });

  describe('generateOutlinePrompt', () => {
    const title = 'How to Improve Your Wellness Journey';

    it('should generate a prompt with all settings', () => {
      const result = promptService.generateOutlinePrompt(
        mockSettings as ContentSettings,
        title
      );

      expect(result).toContain(title);
      expect(result).toContain('wellness');
      expect(result).toContain('health-conscious professionals');
      expect(result).toContain('warm and expert');
      expect(result).toContain('wellness, health');
      expect(result).toContain('engagement, education');
      expect(result).toContain('1200–2000 words');
    });

    it('should use SHORT_FORM length guidance', () => {
      const settings = { ...mockSettings, preferredLength: 'SHORT_FORM' };

      const result = promptService.generateOutlinePrompt(
        settings as ContentSettings,
        title
      );

      expect(result).toContain('800–1200 words');
    });

    it('should use LONG_FORM length guidance', () => {
      const settings = { ...mockSettings, preferredLength: 'LONG_FORM' };

      const result = promptService.generateOutlinePrompt(
        settings as ContentSettings,
        title
      );

      expect(result).toContain('1800–2500 words');
    });

    it('should include structure hint when provided', () => {
      const structureHint = 'Use a problem-solution-action framework';

      const result = promptService.generateOutlinePrompt(
        mockSettings as ContentSettings,
        title,
        structureHint
      );

      expect(result).toContain('Structure hint');
      expect(result).toContain(structureHint);
    });

    it('should not include structure hint when not provided', () => {
      const result = promptService.generateOutlinePrompt(
        mockSettings as ContentSettings,
        title
      );

      expect(result).not.toContain('Structure hint');
    });

    it('should include JSON schema', () => {
      const result = promptService.generateOutlinePrompt(
        mockSettings as ContentSettings,
        title
      );

      expect(result).toContain('"title": string');
      expect(result).toContain('"seoKeywords": string[]');
      expect(result).toContain('"metaDescription": string');
      expect(result).toContain('"structure"');
      expect(result).toContain('"introduction"');
      expect(result).toContain('"sections"');
      expect(result).toContain('"conclusion"');
    });
  });

  describe('generateBlogPrompt', () => {
    const title = 'Complete Guide to Wellness';
    const outline = {
      title: 'Complete Guide to Wellness',
      seoKeywords: ['wellness', 'health guide'],
      metaDescription: 'A comprehensive wellness guide',
      structure: {
        introduction: {
          summary: 'Intro summary',
          keyPoints: ['Point 1', 'Point 2'],
        },
        sections: [
          {
            heading: 'Understanding Wellness',
            subheadings: ['Physical Health', 'Mental Health'],
            points: ['Exercise regularly', 'Practice mindfulness'],
          },
        ],
        conclusion: {
          summary: 'Conclusion summary',
          cta: 'Start your wellness journey today',
        },
      },
    };

    it('should generate a prompt with all settings and outline', () => {
      const result = promptService.generateBlogPrompt(
        mockSettings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain(title);
      expect(result).toContain('wellness');
      expect(result).toContain('health-conscious professionals');
      expect(result).toContain('warm and expert');
      expect(result).toContain('1,500–2,200 words');
      expect(result).toContain(JSON.stringify(outline, null, 2));
    });

    it('should use SHORT_FORM length guidance', () => {
      const settings = { ...mockSettings, preferredLength: 'SHORT_FORM' };

      const result = promptService.generateBlogPrompt(
        settings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('900–1,300 words');
    });

    it('should use LONG_FORM length guidance', () => {
      const settings = { ...mockSettings, preferredLength: 'LONG_FORM' };

      const result = promptService.generateBlogPrompt(
        settings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('2,000–2,800 words');
    });

    it('should handle null outline', () => {
      const result = promptService.generateBlogPrompt(
        mockSettings as ContentSettings,
        title,
        null
      );

      expect(result).toContain('No explicit outline was provided');
      expect(result).not.toContain('"structure"');
    });

    it('should include markdown formatting instructions', () => {
      const result = promptService.generateBlogPrompt(
        mockSettings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('# ');
      expect(result).toContain('## ');
      expect(result).toContain('### ');
      expect(result).toContain('Markdown');
    });

    it('should include JSON output schema', () => {
      const result = promptService.generateBlogPrompt(
        mockSettings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('"title": string');
      expect(result).toContain('"content": string');
      expect(result).toContain('"wordCount": number');
    });

    it('should specify content must be in Markdown', () => {
      const result = promptService.generateBlogPrompt(
        mockSettings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('MUST be valid Markdown');
      expect(result).toContain('H1 as the article title');
      expect(result).toContain('H2/H3 sections');
    });

    it('should include SEO and keyword integration guidance', () => {
      const result = promptService.generateBlogPrompt(
        mockSettings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('Primary keywords');
      expect(result).toContain('Secondary keywords');
      expect(result).toContain('headings');
      expect(result).toContain('keyword stuffing');
    });

    it('should handle empty settings arrays', () => {
      const emptySettings: Partial<ContentSettings> = {
        primaryKeywords: [],
        secondaryKeywords: [],
        goals: [],
        competitorUrls: [],
        topicsToAvoid: [],
      };

      const result = promptService.generateBlogPrompt(
        emptySettings as ContentSettings,
        title,
        outline
      );

      expect(result).toContain('None');
      expect(result).toContain('Education, engagement, and trust-building');
    });
  });
});
