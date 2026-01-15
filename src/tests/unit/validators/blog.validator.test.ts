import {
  generateBlogSchema,
  updateBlogSchema,
  publishBlogSchema,
  exportBlogSchema,
  approveBlogSchema
} from '../../../validators/blog.validator'

describe('Blog Validator', () => {
  describe('generateBlogSchema', () => {
    describe('valid inputs', () => {
      it('should validate with only required blogOutlineId', () => {
        const validData = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn'
        }

        const result = generateBlogSchema.parse(validData)
        expect(result.blogOutlineId).toBe('cjld2cjxh0000qzrmn831i7rn')
      })

      it('should validate with blogOutlineId and additionalInstructions', () => {
        const validData = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: 'Include code examples'
        }

        const result = generateBlogSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with max length additionalInstructions (1000 chars)', () => {
        const validData = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: 'a'.repeat(1000)
        }

        const result = generateBlogSchema.parse(validData)
        expect(result.additionalInstructions?.length).toBe(1000)
      })

      it('should validate with empty string additionalInstructions', () => {
        const validData = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: ''
        }

        const result = generateBlogSchema.parse(validData)
        expect(result.additionalInstructions).toBe('')
      })

      it('should validate various valid CUID formats', () => {
        const validCuids = [
          'cjld2cjxh0000qzrmn831i7rn',
          'ckl3xt5n00000hkt68o8e9h0e',
          'cl2xrf3qr0000dnm6r2hqcz3a'
        ]

        validCuids.forEach(cuid => {
          const data = { blogOutlineId: cuid }
          const result = generateBlogSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when blogOutlineId is missing', () => {
        const invalidData = {
          additionalInstructions: 'Some instructions'
        }

        const result = generateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('blogOutlineId')
        }
      })

      it('should fail when blogOutlineId is not a valid CUID', () => {
        const invalidCuids = [
          'invalid-cuid',
          '12345',
          'abc',
          'not_a_cuid_format'
        ]

        invalidCuids.forEach(cuid => {
          const data = { blogOutlineId: cuid }
          const result = generateBlogSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid blog outline ID')
          }
        })
      })

      it('should fail when blogOutlineId is empty string', () => {
        const invalidData = {
          blogOutlineId: ''
        }

        const result = generateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when additionalInstructions exceeds 1000 characters', () => {
        const invalidData = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn',
          additionalInstructions: 'a'.repeat(1001)
        }

        const result = generateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Instructions are too long')
        }
      })

      it('should fail when blogOutlineId is null', () => {
        const invalidData = {
          blogOutlineId: null
        }

        const result = generateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate without additionalInstructions', () => {
        const data = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn'
        }

        const result = generateBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow extra fields', () => {
        const data = {
          blogOutlineId: 'cjld2cjxh0000qzrmn831i7rn',
          extraField: 'ignored'
        }

        const result = generateBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateBlogSchema', () => {
    describe('valid inputs', () => {
      it('should validate with empty object (all fields optional)', () => {
        const validData = {}

        const result = updateBlogSchema.parse(validData)
        expect(result).toEqual({})
      })

      it('should validate with only content', () => {
        const validData = {
          content: 'a'.repeat(100) // minimum 100 characters
        }

        const result = updateBlogSchema.parse(validData)
        expect(result.content).toBe(validData.content)
      })

      it('should validate with only htmlContent', () => {
        const validData = {
          htmlContent: '<p>' + 'a'.repeat(100) + '</p>' // minimum 100 characters
        }

        const result = updateBlogSchema.parse(validData)
        expect(result.htmlContent?.length).toBeGreaterThanOrEqual(100)
      })

      it('should validate with status', () => {
        const statuses = ['DRAFT', 'APPROVED', 'PUBLISHED', 'EXPORTED'] as const

        statuses.forEach(status => {
          const data = { status }
          const result = updateBlogSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should validate with all fields', () => {
        const validData = {
          content: 'a'.repeat(200),
          htmlContent: '<p>' + 'a'.repeat(200) + '</p>',
          status: 'DRAFT' as const
        }

        const result = updateBlogSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate content at min length (100 chars)', () => {
        const validData = {
          content: 'a'.repeat(100)
        }

        const result = updateBlogSchema.parse(validData)
        expect(result.content?.length).toBe(100)
      })

      it('should validate content at max length (50000 chars)', () => {
        const validData = {
          content: 'a'.repeat(50000)
        }

        const result = updateBlogSchema.parse(validData)
        expect(result.content?.length).toBe(50000)
      })

      it('should validate htmlContent at min length (100 chars)', () => {
        const validData = {
          htmlContent: 'a'.repeat(100)
        }

        const result = updateBlogSchema.parse(validData)
        expect(result.htmlContent?.length).toBe(100)
      })

      it('should validate htmlContent at max length (100000 chars)', () => {
        const validData = {
          htmlContent: 'a'.repeat(100000)
        }

        const result = updateBlogSchema.parse(validData)
        expect(result.htmlContent?.length).toBe(100000)
      })
    })

    describe('invalid inputs', () => {
      it('should fail when content is too short (< 100 chars)', () => {
        const invalidData = {
          content: 'Too short'
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Content is too short')
        }
      })

      it('should fail when content exceeds 50000 characters', () => {
        const invalidData = {
          content: 'a'.repeat(50001)
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Content is too long')
        }
      })

      it('should fail when htmlContent is too short (< 100 chars)', () => {
        const invalidData = {
          htmlContent: '<p>Short</p>'
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('HTML content is too short')
        }
      })

      it('should fail when htmlContent exceeds 100000 characters', () => {
        const invalidData = {
          htmlContent: 'a'.repeat(100001)
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('HTML content is too long')
        }
      })

      it('should fail with invalid status', () => {
        const invalidData = {
          status: 'INVALID_STATUS'
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid status')
        }
      })

      it('should fail when status is lowercase', () => {
        const invalidData = {
          status: 'draft'
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when content is null', () => {
        const invalidData = {
          content: null
        }

        const result = updateBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate with undefined values', () => {
        const data = {
          content: undefined,
          htmlContent: undefined,
          status: undefined
        }

        const result = updateBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate partial updates with single field', () => {
        const updates = [
          { status: 'DRAFT' as const },
          { content: 'a'.repeat(100) }
        ]

        updates.forEach(update => {
          const result = updateBlogSchema.safeParse(update)
          expect(result.success).toBe(true)
        })
      })
    })
  })

  describe('publishBlogSchema', () => {
    describe('valid inputs', () => {
      it('should validate with status PUBLISHED only', () => {
        const validData = {
          status: 'PUBLISHED' as const
        }

        const result = publishBlogSchema.parse(validData)
        expect(result.status).toBe('PUBLISHED')
      })

      it('should validate with status PUBLISHED and publishedAt', () => {
        const validData = {
          status: 'PUBLISHED' as const,
          publishedAt: new Date('2024-01-01')
        }

        const result = publishBlogSchema.parse(validData)
        expect(result.status).toBe('PUBLISHED')
        expect(result.publishedAt).toBeInstanceOf(Date)
      })

      it('should coerce string date to Date object', () => {
        const validData = {
          status: 'PUBLISHED' as const,
          publishedAt: '2024-01-01'
        }

        const result = publishBlogSchema.parse(validData)
        expect(result.publishedAt).toBeInstanceOf(Date)
      })

      it('should coerce timestamp to Date object', () => {
        const validData = {
          status: 'PUBLISHED' as const,
          publishedAt: 1704067200000 // timestamp
        }

        const result = publishBlogSchema.parse(validData)
        expect(result.publishedAt).toBeInstanceOf(Date)
      })

      it('should validate various date formats', () => {
        const dates = [
          '2024-01-01',
          '2024-01-01T00:00:00Z',
          '2024-01-01T00:00:00.000Z',
          new Date('2024-01-01')
        ]

        dates.forEach(date => {
          const data = {
            status: 'PUBLISHED' as const,
            publishedAt: date
          }
          const result = publishBlogSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when status is not PUBLISHED', () => {
        const invalidStatuses = ['DRAFT', 'APPROVED', 'EXPORTED']

        invalidStatuses.forEach(status => {
          const data = { status }
          const result = publishBlogSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it('should fail when status is missing', () => {
        const invalidData = {
          publishedAt: new Date()
        }

        const result = publishBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail with invalid date format', () => {
        const invalidData = {
          status: 'PUBLISHED' as const,
          publishedAt: 'not-a-date'
        }

        const result = publishBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid date format')
        }
      })

      it('should fail when status is lowercase', () => {
        const invalidData = {
          status: 'published'
        }

        const result = publishBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is null', () => {
        const invalidData = {
          status: null
        }

        const result = publishBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate without publishedAt field', () => {
        const data = {
          status: 'PUBLISHED' as const
        }

        const result = publishBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with undefined publishedAt', () => {
        const data = {
          status: 'PUBLISHED' as const,
          publishedAt: undefined
        }

        const result = publishBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow extra fields', () => {
        const data = {
          status: 'PUBLISHED' as const,
          publishedAt: new Date(),
          extraField: 'ignored'
        }

        const result = publishBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('type safety', () => {
      it('should enforce literal type PUBLISHED', () => {
        const validData = {
          status: 'PUBLISHED' as const
        }

        const result = publishBlogSchema.parse(validData)

        // TypeScript type check
        const status: 'PUBLISHED' = result.status
        expect(status).toBe('PUBLISHED')
      })
    })
  })

  describe('exportBlogSchema', () => {
    describe('valid inputs', () => {
      it('should validate with PDF format', () => {
        const validData = {
          format: 'PDF' as const
        }

        const result = exportBlogSchema.parse(validData)
        expect(result.format).toBe('PDF')
      })

      it('should validate with DOCX format', () => {
        const validData = {
          format: 'DOCX' as const
        }

        const result = exportBlogSchema.parse(validData)
        expect(result.format).toBe('DOCX')
      })

      it('should validate with HTML format', () => {
        const validData = {
          format: 'HTML' as const
        }

        const result = exportBlogSchema.parse(validData)
        expect(result.format).toBe('HTML')
      })

      it('should validate with MARKDOWN format', () => {
        const validData = {
          format: 'MARKDOWN' as const
        }

        const result = exportBlogSchema.parse(validData)
        expect(result.format).toBe('MARKDOWN')
      })

      it('should validate all enum values', () => {
        const formats = ['PDF', 'DOCX', 'HTML', 'MARKDOWN'] as const

        formats.forEach(format => {
          const data = { format }
          const result = exportBlogSchema.safeParse(data)
          expect(result.success).toBe(true)
          if (result.success) {
            expect(result.data.format).toBe(format)
          }
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when format is missing', () => {
        const invalidData = {}

        const result = exportBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('format')
        }
      })

      it('should fail with invalid format value', () => {
        const invalidFormats = [
          'TXT',
          'JSON',
          'XML',
          'CSV',
          'pdf',
          'docx',
          'html',
          'markdown',
          ''
        ]

        invalidFormats.forEach(format => {
          const data = { format }
          const result = exportBlogSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid export format')
          }
        })
      })

      it('should fail when format is null', () => {
        const invalidData = {
          format: null
        }

        const result = exportBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when format is undefined', () => {
        const invalidData = {
          format: undefined
        }

        const result = exportBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when format is a number', () => {
        const invalidData = {
          format: 1
        }

        const result = exportBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail with lowercase formats', () => {
        const data = {
          format: 'pdf'
        }

        const result = exportBlogSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should not validate mixed case formats', () => {
        const data = {
          format: 'Pdf'
        }

        const result = exportBlogSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should allow extra fields', () => {
        const data = {
          format: 'PDF' as const,
          extraField: 'ignored'
        }

        const result = exportBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('type safety', () => {
      it('should enforce enum type', () => {
        const validData = {
          format: 'PDF' as const
        }

        const result = exportBlogSchema.parse(validData)

        // TypeScript type check
        const format: 'PDF' | 'DOCX' | 'HTML' | 'MARKDOWN' = result.format
        expect(format).toBe('PDF')
      })

      it('should parse and validate correct enum values', () => {
        expect(() => exportBlogSchema.parse({ format: 'PDF' })).not.toThrow()
        expect(() => exportBlogSchema.parse({ format: 'DOCX' })).not.toThrow()
        expect(() => exportBlogSchema.parse({ format: 'HTML' })).not.toThrow()
        expect(() => exportBlogSchema.parse({ format: 'MARKDOWN' })).not.toThrow()
      })

      it('should throw for invalid enum values', () => {
        expect(() => exportBlogSchema.parse({ format: 'INVALID' })).toThrow()
        expect(() => exportBlogSchema.parse({ format: 'pdf' })).toThrow()
      })
    })
  })

  describe('approveBlogSchema', () => {
    describe('valid inputs', () => {
      it('should validate with status APPROVED', () => {
        const validData = {
          status: 'APPROVED' as const
        }

        const result = approveBlogSchema.parse(validData)
        expect(result.status).toBe('APPROVED')
      })

      it('should enforce literal type APPROVED', () => {
        const validData = {
          status: 'APPROVED' as const
        }

        expect(() => approveBlogSchema.parse(validData)).not.toThrow()
      })
    })

    describe('invalid inputs', () => {
      it('should fail when status is not APPROVED', () => {
        const invalidStatuses = ['DRAFT', 'PUBLISHED', 'EXPORTED', 'PENDING']

        invalidStatuses.forEach(status => {
          const data = { status }
          const result = approveBlogSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it('should fail when status is missing', () => {
        const invalidData = {}

        const result = approveBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is lowercase', () => {
        const invalidData = {
          status: 'approved'
        }

        const result = approveBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is null', () => {
        const invalidData = {
          status: null
        }

        const result = approveBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when status is undefined', () => {
        const invalidData = {
          status: undefined
        }

        const result = approveBlogSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should allow extra fields', () => {
        const data = {
          status: 'APPROVED' as const,
          extraField: 'ignored'
        }

        const result = approveBlogSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should not validate mixed case', () => {
        const data = {
          status: 'Approved'
        }

        const result = approveBlogSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('type safety', () => {
      it('should enforce literal type APPROVED', () => {
        const validData = {
          status: 'APPROVED' as const
        }

        const result = approveBlogSchema.parse(validData)

        // TypeScript type check
        const status: 'APPROVED' = result.status
        expect(status).toBe('APPROVED')
      })

      it('should parse correct value', () => {
        expect(() => approveBlogSchema.parse({ status: 'APPROVED' })).not.toThrow()
      })

      it('should throw for invalid values', () => {
        expect(() => approveBlogSchema.parse({ status: 'DRAFT' })).toThrow()
        expect(() => approveBlogSchema.parse({ status: 'approved' })).toThrow()
      })
    })
  })
})
