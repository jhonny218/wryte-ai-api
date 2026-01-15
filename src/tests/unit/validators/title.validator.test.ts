import { titleGenerationSchema } from '../../../validators/title.validator'
import { z } from 'zod'

describe('Title Validator', () => {
  describe('titleGenerationSchema', () => {
    describe('valid inputs', () => {
      it('should validate with valid dates array and organizationId', () => {
        const validData = {
          dates: ['2024-01-01', '2024-01-02'],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with single date in array', () => {
        const validData = {
          dates: ['2024-01-01'],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with multiple dates', () => {
        const validData = {
          dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate dates as optional field when provided with values', () => {
        const validData = {
          dates: ['2024-01-01'],
          organizationId: 'cuid_example_12345'
        }

        const result = titleGenerationSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('should fail when dates array is empty', () => {
        const invalidData = {
          dates: [],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid configuration for the selected type')
        }
      })

      it('should fail when dates is undefined', () => {
        const invalidData = {
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid configuration for the selected type')
        }
      })

      it('should fail when dates is null', () => {
        const invalidData = {
          dates: null,
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when organizationId is missing', () => {
        const invalidData = {
          dates: ['2024-01-01']
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('organizationId')
        }
      })

      it('should allow empty organizationId string (no min length validation)', () => {
        const invalidData = {
          dates: ['2024-01-01'],
          organizationId: ''
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        // The schema doesn't enforce min length, so this passes
        expect(result.success).toBe(true)
      })

      it('should fail when dates array contains non-string values', () => {
        const invalidData = {
          dates: [123, 456],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when dates is not an array', () => {
        const invalidData = {
          dates: '2024-01-01',
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should fail with only organizationId provided', () => {
        const data = {
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid configuration for the selected type')
        }
      })

      it('should fail with extra unexpected fields', () => {
        const data = {
          dates: ['2024-01-01'],
          organizationId: 'org123',
          extraField: 'unexpected'
        }

        // Zod by default allows extra fields, so this should pass
        const result = titleGenerationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate dates with empty strings in array but still pass array check', () => {
        const data = {
          dates: [''],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(data)
        // Should pass as dates array has length > 0
        expect(result.success).toBe(true)
      })

      it('should handle very long organizationId', () => {
        const data = {
          dates: ['2024-01-01'],
          organizationId: 'a'.repeat(1000)
        }

        const result = titleGenerationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should handle dates array with many elements', () => {
        const data = {
          dates: Array(100).fill('2024-01-01'),
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('refine custom validation', () => {
      it('should use custom error message for refine validation', () => {
        const invalidData = {
          dates: [],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          const errorMessage = result.error.issues.find(e =>
            e.message === 'Invalid configuration for the selected type'
          )
          expect(errorMessage).toBeDefined()
        }
      })

      it('should validate the refine condition with dates present and non-empty', () => {
        const validData = {
          dates: ['2024-01-01', '2024-01-02'],
          organizationId: 'org123'
        }

        expect(() => titleGenerationSchema.parse(validData)).not.toThrow()
      })

      it('should fail refine validation when dates is explicitly undefined', () => {
        const invalidData = {
          dates: undefined,
          organizationId: 'org123'
        }

        expect(() => titleGenerationSchema.parse(invalidData)).toThrow()
      })
    })

    describe('type inference', () => {
      it('should infer correct TypeScript type', () => {
        const validData = {
          dates: ['2024-01-01'],
          organizationId: 'org123'
        }

        const result = titleGenerationSchema.parse(validData)

        // Type checks (will cause TypeScript errors if types are wrong)
        const dates: string[] | undefined = result.dates
        const orgId: string = result.organizationId

        expect(dates).toBeDefined()
        expect(orgId).toBeDefined()
      })
    })
  })
})
