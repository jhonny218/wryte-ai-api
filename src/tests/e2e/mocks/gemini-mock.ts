import { logger } from '../../../utils/logger'

/**
 * Mock Gemini AI Service for E2E testing
 * Provides deterministic responses for titles, outlines, and blogs
 */
export class MockGeminiService {
  /**
   * Generate mock blog titles with scheduled dates
   */
  async generateTitles(input: {
    keywords: string[]
    tone: string
    targetAudience: string
    count: number
  }): Promise<Array<{ title: string; scheduledDate: string }>> {
    logger.info('[MockGemini] Generating titles', { input })

    const baseDate = new Date('2026-01-20')
    const titles: Array<{ title: string; scheduledDate: string }> = []

    for (let i = 0; i < Math.min(input.count, 10); i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + i * 3) // Every 3 days

      titles.push({
        title: `${input.keywords[0] || 'Tech'} Guide ${i + 1}: ${input.tone} Edition for ${input.targetAudience}`,
        scheduledDate: date.toISOString().slice(0, 10),
      })
    }

    return titles
  }

  /**
   * Generate mock blog outline
   */
  async generateOutline(input: {
    title: string
    keywords?: string[]
    tone?: string
    targetAudience?: string
  }): Promise<{
    structure: Array<{
      heading: string
      subheadings?: string[]
    }>
    seoKeywords: string[]
    metaDescription: string
    suggestedImages: string[]
  }> {
    logger.info('[MockGemini] Generating outline', { input })

    return {
      structure: [
        {
          heading: 'Introduction',
          subheadings: [
            'Why This Topic Matters',
            'What You Will Learn',
          ],
        },
        {
          heading: 'Main Content Section 1',
          subheadings: [
            'Key Concept 1',
            'Key Concept 2',
            'Practical Example',
          ],
        },
        {
          heading: 'Main Content Section 2',
          subheadings: [
            'Advanced Techniques',
            'Best Practices',
            'Common Mistakes to Avoid',
          ],
        },
        {
          heading: 'Conclusion',
          subheadings: [
            'Key Takeaways',
            'Next Steps',
            'Additional Resources',
          ],
        },
      ],
      seoKeywords: input.keywords || ['tech', 'guide', 'tutorial', 'best practices'],
      metaDescription: `Learn everything about ${input.title.slice(0, 120)}...`,
      suggestedImages: [
        'featured-image.jpg',
        'diagram-1.png',
        'screenshot-example.png',
      ],
    }
  }

  /**
   * Generate mock blog content in markdown
   */
  async generateBlog(input: {
    title: string
    outline: {
      structure: Array<{
        heading: string
        subheadings?: string[]
      }>
    }
    keywords?: string[]
    tone?: string
    additionalInstructions?: string
  }): Promise<string> {
    logger.info('[MockGemini] Generating blog', { input })

    let markdown = `# ${input.title}\n\n`

    for (const section of input.outline.structure) {
      markdown += `## ${section.heading}\n\n`
      
      if (section.subheadings) {
        for (const sub of section.subheadings) {
          markdown += `### ${sub}\n\n`
          markdown += `This is placeholder content for "${sub}". In a real blog, this would contain detailed information, examples, and insights.\n\n`
          markdown += `- **Key point 1**: Important detail about ${sub.toLowerCase()}\n`
          markdown += `- **Key point 2**: Another crucial aspect to consider\n`
          markdown += `- **Key point 3**: Practical implementation tip\n\n`
        }
      } else {
        markdown += `This section covers ${section.heading.toLowerCase()}. It would include comprehensive information and examples.\n\n`
      }
    }

    markdown += `\n---\n\n`
    markdown += `*This blog was generated with ${input.tone || 'professional'} tone for ${input.keywords?.join(', ') || 'general audience'}.*\n`

    return markdown
  }

  /**
   * Check if mock service is available (always true)
   */
  async healthCheck(): Promise<boolean> {
    return true
  }
}

/**
 * Get instance of mock Gemini service
 */
export function getMockGeminiService(): MockGeminiService {
  return new MockGeminiService()
}
