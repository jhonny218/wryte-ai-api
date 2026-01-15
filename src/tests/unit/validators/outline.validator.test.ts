import {
  generateOutlineSchema,
  updateOutlineSchema,
  approveOutlineSchema,
  rejectOutlineSchema
} from '../../../validators/outline.validator'

describe('Outline Validator', () => {
  describe('generateOutlineSchema', () => {
    describe('valid inputs', () => {
      it('should validate with only required blogTitleId', () => {
        const validData = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn'
        }

        const result = generateOutlineSchema.parse(validData)
        expect(result.blogTitleId).toBe('cjld2cjxh0000qzrmn831i7rn')
      })

      it('should validate with blogTitleId and additionalInstructions', () => {
        const validData = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: 'Please focus on technical aspects'
        }

        const result = generateOutlineSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with max length additionalInstructions (1000 chars)', () => {
        const validData = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: 'a'.repeat(1000)
        }

        const result = generateOutlineSchema.parse(validData)
        expect(result.additionalInstructions?.length).toBe(1000)
      })

      it('should validate with empty string additionalInstructions', () => {
        const validData = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: ''
        }

        const result = generateOutlineSchema.parse(validData)
        expect(result.additionalInstructions).toBe('')
      })

      it('should validate various valid CUID formats', () => {
        const validCuids = [
          'cjld2cjxh0000qzrmn831i7rn',
          'ckl3xt5n00000hkt68o8e9h0e',
          'cl2xrf3qr0000dnm6r2hqcz3a'
        ]

        validCuids.forEach(cuid => {
          const data = { blogTitleId: cuid }
          const result = generateOutlineSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when blogTitleId is missing', () => {
        const invalidData = {
          additionalInstructions: 'Some instructions'
        }

        const result = generateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('blogTitleId')
        }
      })

      it('should fail when blogTitleId is not a valid CUID', () => {
        const invalidCuids = [
          'invalid-cuid',
          '12345',
          'abc',
          'not_a_cuid_format'
        ]

        invalidCuids.forEach(cuid => {
          const data = { blogTitleId: cuid }
          const result = generateOutlineSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid blog title ID')
          }
        })
      })

      it('should fail when blogTitleId is empty string', () => {
        const invalidData = {
          blogTitleId: ''
        }

        const result = generateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when additionalInstructions exceeds 1000 characters', () => {
        const invalidData = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: 'a'.repeat(1001)
        }

        const result = generateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Instructions are too long')
        }
      })

      it('should fail when blogTitleId is null', () => {
        const invalidData = {
          blogTitleId: null
        }

        const result = generateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate without additionalInstructions', () => {
        const data = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn'
        }

        const result = generateOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow extra fields', () => {
        const data = {
          blogTitleId: 'cjld2cjxh0000qzrmn831i7rn',
          extraField: 'ignored'
        }

        const result = generateOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateOutlineSchema', () => {
    describe('valid inputs', () => {
      it('should validate with empty object (all fields optional)', () => {
        const validData = {}

        const result = updateOutlineSchema.parse(validData)
        expect(result).toEqual({})
      })

      it('should validate with structure field', () => {
        const validData = {
          structure: {
            introduction: 'Intro text',
            sections: ['Section 1', 'Section 2']
          }
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.structure).toEqual(validData.structure)
      })

      it('should validate with seoKeywords', () => {
        const validData = {
          seoKeywords: ['keyword1', 'keyword2', 'keyword3']
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.seoKeywords).toEqual(validData.seoKeywords)
      })

      it('should validate with metaDescription', () => {
        const validData = {
          metaDescription: 'a'.repeat(50) // minimum 50 characters
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.metaDescription).toBe(validData.metaDescription)
      })

      it('should validate with suggestedImages', () => {
        const validData = {
          suggestedImages: ['image1.jpg', 'image2.png', 'image3.webp']
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.suggestedImages).toEqual(validData.suggestedImages)
      })

      it('should validate with status', () => {
        const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING'] as const

        statuses.forEach(status => {
          const data = { status }
          const result = updateOutlineSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should validate with all fields', () => {
        const validData = {
          structure: { title: 'Main Title', sections: [] },
          seoKeywords: ['seo', 'keyword'],
          metaDescription: 'a'.repeat(100),
          suggestedImages: ['image1.jpg'],
          status: 'APPROVED' as const
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with max seoKeywords (20)', () => {
        const validData = {
          seoKeywords: Array(20).fill('keyword').map((k, i) => `${k}${i}`)
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.seoKeywords?.length).toBe(20)
      })

      it('should validate with max suggestedImages (10)', () => {
        const validData = {
          suggestedImages: Array(10).fill('image').map((img, i) => `${img}${i}.jpg`)
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.suggestedImages?.length).toBe(10)
      })

      it('should validate metaDescription at min length (50 chars)', () => {
        const validData = {
          metaDescription: 'a'.repeat(50)
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.metaDescription?.length).toBe(50)
      })

      it('should validate metaDescription at max length (160 chars)', () => {
        const validData = {
          metaDescription: 'a'.repeat(160)
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.metaDescription?.length).toBe(160)
      })

      it('should validate complex structure object', () => {
        const validData = {
          structure: {
            title: 'Main Title',
            subtitle: 'Subtitle',
            sections: [
              { heading: 'Section 1', content: 'Content 1' },
              { heading: 'Section 2', content: 'Content 2' }
            ],
            conclusion: 'Conclusion text',
            metadata: {
              wordCount: 1000,
              readingTime: 5
            }
          }
        }

        const result = updateOutlineSchema.parse(validData)
        expect(result.structure).toEqual(validData.structure)
      })
    })

    describe('invalid inputs', () => {
      it('should fail when seoKeywords contains empty string', () => {
        const invalidData = {
          seoKeywords: ['keyword1', '']
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when seoKeywords exceeds 20', () => {
        const invalidData = {
          seoKeywords: Array(21).fill('keyword').map((k, i) => `${k}${i}`)
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many SEO keywords')
        }
      })

      it('should fail when metaDescription is too short (< 50 chars)', () => {
        const invalidData = {
          metaDescription: 'Too short'
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Meta description is too short')
        }
      })

      it('should fail when metaDescription is too long (> 160 chars)', () => {
        const invalidData = {
          metaDescription: 'a'.repeat(161)
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Meta description is too long')
        }
      })

      it('should fail when suggestedImages exceeds 10', () => {
        const invalidData = {
          suggestedImages: Array(11).fill('image').map((img, i) => `${img}${i}.jpg`)
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Too many suggested images')
        }
      })

      it('should fail with invalid status', () => {
        const invalidData = {
          status: 'INVALID_STATUS'
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid status')
        }
      })

      it('should fail when structure is not an object', () => {
        const invalidData = {
          structure: 'not an object'
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when seoKeywords is not an array', () => {
        const invalidData = {
          seoKeywords: 'not an array'
        }

        const result = updateOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate empty seoKeywords array', () => {
        const data = {
          seoKeywords: []
        }

        const result = updateOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate empty suggestedImages array', () => {
        const data = {
          suggestedImages: []
        }

        const result = updateOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate empty structure object', () => {
        const data = {
          structure: {}
        }

        const result = updateOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate structure with nested objects and arrays', () => {
        const data = {
          structure: {
            level1: {
              level2: {
                level3: ['item1', 'item2']
              }
            }
          }
        }

        const result = updateOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('approveOutlineSchema', () => {
    describe('valid inputs', () => {
      it('should validate with status APPROVED', () => {
        const validData = {
          status: 'APPROVED' as const
        }

        const result = approveOutlineSchema.parse(validData)
        expect(result.status).toBe('APPROVED')
      })

      it('should enforce literal type APPROVED', () => {
        const validData = {
          status: 'APPROVED' as const
        }

        expect(() => approveOutlineSchema.parse(validData)).not.toThrow()
      })
    })

    describe('invalid inputs', () => {
      it('should fail when status is not APPROVED', () => {
        const invalidStatuses = ['PENDING', 'REJECTED', 'REGENERATING', 'DRAFT']

        invalidStatuses.forEach(status => {
          const data = { status }
          const result = approveOutlineSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it('should fail when status is missing', () => {
        const invalidData = {}

        const result = approveOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is lowercase', () => {
        const invalidData = {
          status: 'approved'
        }

        const result = approveOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is null', () => {
        const invalidData = {
          status: null
        }

        const result = approveOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should allow extra fields', () => {
        const data = {
          status: 'APPROVED' as const,
          extraField: 'ignored'
        }

        const result = approveOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('rejectOutlineSchema', () => {
    describe('valid inputs', () => {
      it('should validate with status REJECTED only', () => {
        const validData = {
          status: 'REJECTED' as const
        }

        const result = rejectOutlineSchema.parse(validData)
        expect(result.status).toBe('REJECTED')
      })

      it('should validate with status REJECTED and feedback', () => {
        const validData = {
          status: 'REJECTED' as const,
          feedback: 'Please revise the structure'
        }

        const result = rejectOutlineSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with max length feedback (500 chars)', () => {
        const validData = {
          status: 'REJECTED' as const,
          feedback: 'a'.repeat(500)
        }

        const result = rejectOutlineSchema.parse(validData)
        expect(result.feedback?.length).toBe(500)
      })

      it('should validate with empty string feedback', () => {
        const validData = {
          status: 'REJECTED' as const,
          feedback: ''
        }

        const result = rejectOutlineSchema.parse(validData)
        expect(result.feedback).toBe('')
      })
    })

    describe('invalid inputs', () => {
      it('should fail when status is not REJECTED', () => {
        const invalidStatuses = ['PENDING', 'APPROVED', 'REGENERATING', 'DRAFT']

        invalidStatuses.forEach(status => {
          const data = {
            status,
            feedback: 'Some feedback'
          }
          const result = rejectOutlineSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it('should fail when status is missing', () => {
        const invalidData = {
          feedback: 'Some feedback'
        }

        const result = rejectOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when feedback exceeds 500 characters', () => {
        const invalidData = {
          status: 'REJECTED' as const,
          feedback: 'a'.repeat(501)
        }

        const result = rejectOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Feedback is too long')
        }
      })

      it('should fail when status is lowercase', () => {
        const invalidData = {
          status: 'rejected'
        }

        const result = rejectOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is null', () => {
        const invalidData = {
          status: null
        }

        const result = rejectOutlineSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate without feedback field', () => {
        const data = {
          status: 'REJECTED' as const
        }

        const result = rejectOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with undefined feedback', () => {
        const data = {
          status: 'REJECTED' as const,
          feedback: undefined
        }

        const result = rejectOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow extra fields', () => {
        const data = {
          status: 'REJECTED' as const,
          feedback: 'Needs work',
          extraField: 'ignored'
        }

        const result = rejectOutlineSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('type safety', () => {
      it('should enforce literal type REJECTED', () => {
        const validData = {
          status: 'REJECTED' as const
        }

        const result = rejectOutlineSchema.parse(validData)

        // TypeScript type check
        const status: 'REJECTED' = result.status
        expect(status).toBe('REJECTED')
      })
    })
  })
})
