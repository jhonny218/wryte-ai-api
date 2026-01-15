import {
  upsertContentSettingsSchema,
  updateContentSettingsSchema
} from '../../../validators/settings.validator'

describe('Settings Validator', () => {
  describe('upsertContentSettingsSchema', () => {
    describe('valid inputs', () => {
      it('should validate with only required primaryKeywords', () => {
        const validData = {
          primaryKeywords: ['keyword1', 'keyword2']
        }

        const result = upsertContentSettingsSchema.parse(validData)
        expect(result.primaryKeywords).toEqual(['keyword1', 'keyword2'])
        expect(result.secondaryKeywords).toEqual([])
        expect(result.postingDaysOfWeek).toEqual([])
        expect(result.goals).toEqual([])
        expect(result.competitorUrls).toEqual([])
        expect(result.topicsToAvoid).toEqual([])
      })

      it('should validate with all fields', () => {
        const validData = {
          primaryKeywords: ['keyword1'],
          secondaryKeywords: ['secondary1', 'secondary2'],
          postingDaysOfWeek: ['MON', 'WED', 'FRI'] as const,
          tone: 'professional' as const,
          targetAudience: 'Tech enthusiasts',
          industry: 'Technology',
          goals: ['Increase engagement', 'Build authority'],
          competitorUrls: ['https://competitor1.com', 'https://competitor2.com'],
          topicsToAvoid: ['politics', 'religion'],
          preferredLength: 'LONG_FORM' as const
        }

        const result = upsertContentSettingsSchema.parse(validData)
        expect(result).toMatchObject(validData)
      })

      it('should validate with minimum primaryKeywords (1)', () => {
        const validData = {
          primaryKeywords: ['single-keyword']
        }

        const result = upsertContentSettingsSchema.parse(validData)
        expect(result.primaryKeywords).toEqual(['single-keyword'])
      })

      it('should validate with maximum primaryKeywords (10)', () => {
        const validData = {
          primaryKeywords: Array(10).fill('keyword').map((k, i) => `${k}${i}`)
        }

        const result = upsertContentSettingsSchema.parse(validData)
        expect(result.primaryKeywords.length).toBe(10)
      })

      it('should validate all tone enum values', () => {
        const tones = ['professional', 'casual', 'friendly', 'formal', 'witty', 'educational'] as const

        tones.forEach(tone => {
          const data = {
            primaryKeywords: ['keyword'],
            tone
          }
          const result = upsertContentSettingsSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should validate all day of week enum values', () => {
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

        days.forEach(day => {
          const data = {
            primaryKeywords: ['keyword'],
            postingDaysOfWeek: [day]
          }
          const result = upsertContentSettingsSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should validate all preferredLength enum values', () => {
        const lengths = ['SHORT_FORM', 'MEDIUM_FORM', 'LONG_FORM'] as const

        lengths.forEach(length => {
          const data = {
            primaryKeywords: ['keyword'],
            preferredLength: length
          }
          const result = upsertContentSettingsSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should validate multiple postingDaysOfWeek', () => {
        const validData = {
          primaryKeywords: ['keyword'],
          postingDaysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const
        }

        const result = upsertContentSettingsSchema.parse(validData)
        expect(result.postingDaysOfWeek).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI'])
      })

      it('should apply default empty arrays for optional array fields', () => {
        const validData = {
          primaryKeywords: ['keyword']
        }

        const result = upsertContentSettingsSchema.parse(validData)
        expect(result.secondaryKeywords).toEqual([])
        expect(result.postingDaysOfWeek).toEqual([])
        expect(result.goals).toEqual([])
        expect(result.competitorUrls).toEqual([])
        expect(result.topicsToAvoid).toEqual([])
      })
    })

    describe('invalid inputs', () => {
      it('should fail when primaryKeywords is missing', () => {
        const invalidData = {
          tone: 'professional'
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('primaryKeywords')
        }
      })

      it('should fail when primaryKeywords is empty array', () => {
        const invalidData = {
          primaryKeywords: []
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('At least one primary keyword is required')
        }
      })

      it('should fail when primaryKeywords exceeds 10', () => {
        const invalidData = {
          primaryKeywords: Array(11).fill('keyword').map((k, i) => `${k}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many primary keywords')
        }
      })

      it('should fail when primaryKeywords contains empty string', () => {
        const invalidData = {
          primaryKeywords: ['keyword1', '']
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when secondaryKeywords exceeds 20', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          secondaryKeywords: Array(21).fill('keyword').map((k, i) => `${k}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many secondary keywords')
        }
      })

      it('should fail with invalid tone', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          tone: 'invalid-tone'
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid tone')
        }
      })

      it('should fail with invalid day of week', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          postingDaysOfWeek: ['MONDAY', 'TUESDAY']
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid day of week')
        }
      })

      it('should fail when targetAudience exceeds 200 characters', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          targetAudience: 'a'.repeat(201)
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Target audience description is too long')
        }
      })

      it('should fail when industry exceeds 100 characters', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          industry: 'a'.repeat(101)
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Industry name is too long')
        }
      })

      it('should fail when goals exceeds 10', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          goals: Array(11).fill('goal').map((g, i) => `${g}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many goals')
        }
      })

      it('should fail when competitorUrls contains invalid URL', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          competitorUrls: ['https://valid.com', 'not-a-url']
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid competitor URL')
        }
      })

      it('should fail when competitorUrls exceeds 10', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          competitorUrls: Array(11).fill('https://competitor.com')
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many competitor URLs')
        }
      })

      it('should fail when topicsToAvoid exceeds 20', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          topicsToAvoid: Array(21).fill('topic').map((t, i) => `${t}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many topics to avoid')
        }
      })

      it('should fail with invalid preferredLength', () => {
        const invalidData = {
          primaryKeywords: ['keyword'],
          preferredLength: 'EXTRA_LONG'
        }

        const result = upsertContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid preferred length')
        }
      })
    })

    describe('edge cases', () => {
      it('should validate with max length targetAudience (200 chars)', () => {
        const data = {
          primaryKeywords: ['keyword'],
          targetAudience: 'a'.repeat(200)
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with max length industry (100 chars)', () => {
        const data = {
          primaryKeywords: ['keyword'],
          industry: 'a'.repeat(100)
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with exactly 20 secondaryKeywords', () => {
        const data = {
          primaryKeywords: ['keyword'],
          secondaryKeywords: Array(20).fill('keyword').map((k, i) => `${k}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with exactly 10 goals', () => {
        const data = {
          primaryKeywords: ['keyword'],
          goals: Array(10).fill('goal').map((g, i) => `${g}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with exactly 10 competitorUrls', () => {
        const data = {
          primaryKeywords: ['keyword'],
          competitorUrls: Array(10).fill(0).map((_, i) => `https://competitor${i}.com`)
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with exactly 20 topicsToAvoid', () => {
        const data = {
          primaryKeywords: ['keyword'],
          topicsToAvoid: Array(20).fill('topic').map((t, i) => `${t}${i}`)
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with all 7 days of week', () => {
        const data = {
          primaryKeywords: ['keyword'],
          postingDaysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate various valid competitor URLs', () => {
        const data = {
          primaryKeywords: ['keyword'],
          competitorUrls: [
            'https://example.com',
            'http://example.com',
            'https://subdomain.example.com',
            'https://example.com/path/to/page'
          ]
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should fail when goals contains empty string', () => {
        const data = {
          primaryKeywords: ['keyword'],
          goals: ['valid goal', '']
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should fail when topicsToAvoid contains empty string', () => {
        const data = {
          primaryKeywords: ['keyword'],
          topicsToAvoid: ['valid topic', '']
        }

        const result = upsertContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('default values', () => {
      it('should apply default empty array for secondaryKeywords when not provided', () => {
        const data = {
          primaryKeywords: ['keyword']
        }

        const result = upsertContentSettingsSchema.parse(data)
        expect(result.secondaryKeywords).toEqual([])
      })

      it('should apply default empty array for postingDaysOfWeek when not provided', () => {
        const data = {
          primaryKeywords: ['keyword']
        }

        const result = upsertContentSettingsSchema.parse(data)
        expect(result.postingDaysOfWeek).toEqual([])
      })

      it('should apply default empty array for goals when not provided', () => {
        const data = {
          primaryKeywords: ['keyword']
        }

        const result = upsertContentSettingsSchema.parse(data)
        expect(result.goals).toEqual([])
      })

      it('should apply default empty array for competitorUrls when not provided', () => {
        const data = {
          primaryKeywords: ['keyword']
        }

        const result = upsertContentSettingsSchema.parse(data)
        expect(result.competitorUrls).toEqual([])
      })

      it('should apply default empty array for topicsToAvoid when not provided', () => {
        const data = {
          primaryKeywords: ['keyword']
        }

        const result = upsertContentSettingsSchema.parse(data)
        expect(result.topicsToAvoid).toEqual([])
      })

      it('should not apply defaults for explicitly provided empty arrays', () => {
        const data = {
          primaryKeywords: ['keyword'],
          secondaryKeywords: []
        }

        const result = upsertContentSettingsSchema.parse(data)
        expect(result.secondaryKeywords).toEqual([])
      })
    })
  })

  describe('updateContentSettingsSchema', () => {
    describe('valid inputs', () => {
      it('should validate with empty object (all fields optional)', () => {
        const validData = {}

        const result = updateContentSettingsSchema.parse(validData)
        // Defaults are still applied even in partial schema
        expect(result).toEqual({
          secondaryKeywords: [],
          postingDaysOfWeek: [],
          goals: [],
          competitorUrls: [],
          topicsToAvoid: []
        })
      })

      it('should validate with only primaryKeywords', () => {
        const validData = {
          primaryKeywords: ['updated-keyword']
        }

        const result = updateContentSettingsSchema.parse(validData)
        expect(result.primaryKeywords).toEqual(['updated-keyword'])
      })

      it('should validate with any single field', () => {
        const fields = [
          { tone: 'casual' as const },
          { targetAudience: 'Developers' },
          { industry: 'Software' },
          { preferredLength: 'SHORT_FORM' as const }
        ]

        fields.forEach(field => {
          const result = updateContentSettingsSchema.safeParse(field)
          expect(result.success).toBe(true)
        })
      })

      it('should validate partial update with multiple fields', () => {
        const validData = {
          tone: 'professional' as const,
          targetAudience: 'Business professionals'
        }

        const result = updateContentSettingsSchema.parse(validData)
        // Defaults are still applied
        expect(result).toMatchObject(validData)
        expect(result.secondaryKeywords).toEqual([])
        expect(result.postingDaysOfWeek).toEqual([])
      })

      it('should validate all fields when provided', () => {
        const validData = {
          primaryKeywords: ['keyword1'],
          secondaryKeywords: ['secondary1'],
          postingDaysOfWeek: ['MON'] as const,
          tone: 'friendly' as const,
          targetAudience: 'General audience',
          industry: 'E-commerce',
          goals: ['Goal 1'],
          competitorUrls: ['https://competitor.com'],
          topicsToAvoid: ['topic1'],
          preferredLength: 'MEDIUM_FORM' as const
        }

        const result = updateContentSettingsSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should allow primaryKeywords to be empty in partial update', () => {
        const validData = {
          primaryKeywords: []
        }

        // In updateContentSettingsSchema (partial), constraints may be relaxed
        // However, the base schema constraints still apply
        const result = updateContentSettingsSchema.safeParse(validData)
        // This should fail as primaryKeywords.min(1) is still enforced
        expect(result.success).toBe(false)
      })
    })

    describe('invalid inputs', () => {
      it('should fail when primaryKeywords contains empty string', () => {
        const invalidData = {
          primaryKeywords: ['keyword', '']
        }

        const result = updateContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when fields exceed max constraints', () => {
        const invalidData = {
          primaryKeywords: Array(11).fill('keyword')
        }

        const result = updateContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail with invalid enum values', () => {
        const invalidTone = {
          tone: 'invalid-tone'
        }

        const result = updateContentSettingsSchema.safeParse(invalidTone)
        expect(result.success).toBe(false)
      })

      it('should fail with invalid competitor URL', () => {
        const invalidData = {
          competitorUrls: ['not-a-url']
        }

        const result = updateContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate with undefined values', () => {
        const data = {
          primaryKeywords: undefined,
          tone: undefined
        }

        const result = updateContentSettingsSchema.parse(data)
        // Defaults are still applied for array fields
        expect(result).toEqual({
          secondaryKeywords: [],
          postingDaysOfWeek: [],
          goals: [],
          competitorUrls: [],
          topicsToAvoid: []
        })
      })

      it('should validate updating only one field at a time', () => {
        const updates = [
          { targetAudience: 'New audience' },
          { industry: 'New industry' },
          { tone: 'witty' as const }
        ]

        updates.forEach(update => {
          const result = updateContentSettingsSchema.safeParse(update)
          expect(result.success).toBe(true)
        })
      })

      it('should maintain constraints from base schema', () => {
        const data = {
          targetAudience: 'a'.repeat(201)
        }

        const result = updateContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should apply defaults even in partial schema', () => {
        const data = {
          tone: 'casual' as const
        }

        const result = updateContentSettingsSchema.parse(data)
        // Defaults are still applied for array fields with .default([])
        expect(result.tone).toBe('casual')
        expect(result.secondaryKeywords).toEqual([])
        expect(result.goals).toEqual([])
        expect(result.postingDaysOfWeek).toEqual([])
      })
    })

    describe('partial schema behavior', () => {
      it('should make all fields optional', () => {
        const emptyUpdate = {}

        expect(() => updateContentSettingsSchema.parse(emptyUpdate)).not.toThrow()
      })

      it('should allow primaryKeywords to be omitted', () => {
        const data = {
          tone: 'professional' as const
        }

        const result = updateContentSettingsSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should still enforce validation rules when fields are provided', () => {
        const invalidData = {
          tone: 'invalid'
        }

        const result = updateContentSettingsSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })
  })
})
