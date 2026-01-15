import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateMemberRoleSchema
} from '../../../validators/organization.validator'

describe('Organization Validator', () => {
  describe('createOrganizationSchema', () => {
    describe('valid inputs', () => {
      it('should validate with only required name field', () => {
        const validData = {
          name: 'Acme Corporation'
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result.name).toBe('Acme Corporation')
      })

      it('should validate with all fields', () => {
        const validData = {
          name: 'Acme Corporation',
          mission: 'To provide excellent service',
          description: 'A leading company in the industry',
          websiteUrl: 'https://example.com',
          contentSettings: {
            primaryKeywords: ['keyword1', 'keyword2']
          }
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result).toMatchObject(validData)
      })

      it('should validate with empty string for websiteUrl', () => {
        const validData = {
          name: 'Test Org',
          websiteUrl: ''
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result.websiteUrl).toBe('')
      })

      it('should validate without optional fields', () => {
        const validData = {
          name: 'Test Organization'
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result.name).toBe('Test Organization')
      })

      it('should validate with max length name (100 chars)', () => {
        const validData = {
          name: 'a'.repeat(100)
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result.name.length).toBe(100)
      })

      it('should validate with max length mission (1000 chars)', () => {
        const validData = {
          name: 'Test Org',
          mission: 'a'.repeat(1000)
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result.mission?.length).toBe(1000)
      })

      it('should validate with max length description (2000 chars)', () => {
        const validData = {
          name: 'Test Org',
          description: 'a'.repeat(2000)
        }

        const result = createOrganizationSchema.parse(validData)
        expect(result.description?.length).toBe(2000)
      })

      it('should validate various valid URL formats', () => {
        const urls = [
          'https://example.com',
          'http://example.com',
          'https://subdomain.example.com',
          'https://example.com/path',
          'https://example.com:8080',
          'https://example.com?query=value'
        ]

        urls.forEach(url => {
          const data = {
            name: 'Test Org',
            websiteUrl: url
          }
          const result = createOrganizationSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when name is missing', () => {
        const invalidData = {
          mission: 'Test mission'
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('name')
        }
      })

      it('should fail when name is empty string', () => {
        const invalidData = {
          name: ''
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Organization name is required')
        }
      })

      it('should fail when name exceeds 100 characters', () => {
        const invalidData = {
          name: 'a'.repeat(101)
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Name is too long')
        }
      })

      it('should fail when mission exceeds 1000 characters', () => {
        const invalidData = {
          name: 'Test Org',
          mission: 'a'.repeat(1001)
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Mission is too long')
        }
      })

      it('should fail when description exceeds 2000 characters', () => {
        const invalidData = {
          name: 'Test Org',
          description: 'a'.repeat(2001)
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Description is too long')
        }
      })

      it('should fail when websiteUrl is invalid', () => {
        const invalidUrls = [
          'not-a-url',
          'example.com',
          'www.example.com'
        ]

        invalidUrls.forEach(url => {
          const data = {
            name: 'Test Org',
            websiteUrl: url
          }
          const result = createOrganizationSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid URL')
          }
        })
      })

      it('should fail when name is null', () => {
        const invalidData = {
          name: null
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when contentSettings is invalid', () => {
        const invalidData = {
          name: 'Test Org',
          contentSettings: {
            primaryKeywords: [] // Empty array should fail
          }
        }

        const result = createOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate with name containing only whitespace (length > 0)', () => {
        const data = {
          name: '   '
        }

        const result = createOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with undefined optional fields', () => {
        const data = {
          name: 'Test Org',
          mission: undefined,
          description: undefined,
          websiteUrl: undefined,
          contentSettings: undefined
        }

        const result = createOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with empty string mission', () => {
        const data = {
          name: 'Test Org',
          mission: ''
        }

        const result = createOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with empty string description', () => {
        const data = {
          name: 'Test Org',
          description: ''
        }

        const result = createOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow extra fields', () => {
        const data = {
          name: 'Test Org',
          extraField: 'ignored'
        }

        const result = createOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateOrganizationSchema', () => {
    describe('valid inputs', () => {
      it('should validate with empty object (all fields optional)', () => {
        const validData = {}

        const result = updateOrganizationSchema.parse(validData)
        expect(result).toEqual({})
      })

      it('should validate with only name', () => {
        const validData = {
          name: 'Updated Organization'
        }

        const result = updateOrganizationSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with all fields', () => {
        const validData = {
          name: 'Updated Org',
          mission: 'Updated mission',
          description: 'Updated description',
          websiteUrl: 'https://updated.com'
        }

        const result = updateOrganizationSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with empty string for websiteUrl', () => {
        const validData = {
          websiteUrl: ''
        }

        const result = updateOrganizationSchema.parse(validData)
        expect(result.websiteUrl).toBe('')
      })

      it('should validate with max length constraints', () => {
        const validData = {
          name: 'a'.repeat(100),
          mission: 'b'.repeat(1000),
          description: 'c'.repeat(2000)
        }

        const result = updateOrganizationSchema.parse(validData)
        expect(result.name?.length).toBe(100)
        expect(result.mission?.length).toBe(1000)
        expect(result.description?.length).toBe(2000)
      })
    })

    describe('invalid inputs', () => {
      it('should fail when name is empty string', () => {
        const invalidData = {
          name: ''
        }

        const result = updateOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Organization name cannot be empty')
        }
      })

      it('should fail when name exceeds 100 characters', () => {
        const invalidData = {
          name: 'a'.repeat(101)
        }

        const result = updateOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Name is too long')
        }
      })

      it('should fail when mission exceeds 1000 characters', () => {
        const invalidData = {
          mission: 'a'.repeat(1001)
        }

        const result = updateOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Mission is too long')
        }
      })

      it('should fail when description exceeds 2000 characters', () => {
        const invalidData = {
          description: 'a'.repeat(2001)
        }

        const result = updateOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Description is too long')
        }
      })

      it('should fail when websiteUrl is invalid', () => {
        const invalidUrls = [
          'not-a-url',
          'example.com',
          'www.example.com'
        ]

        invalidUrls.forEach(url => {
          const data = {
            websiteUrl: url
          }
          const result = updateOrganizationSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid URL')
          }
        })
      })

      it('should fail when fields are null', () => {
        const invalidData = {
          name: null
        }

        const result = updateOrganizationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate with undefined values', () => {
        const data = {
          name: undefined,
          mission: undefined,
          description: undefined,
          websiteUrl: undefined
        }

        const result = updateOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate partial updates', () => {
        const data = {
          mission: 'New mission only'
        }

        const result = updateOrganizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateMemberRoleSchema', () => {
    describe('valid inputs', () => {
      it('should validate with OWNER role', () => {
        const validData = {
          role: 'OWNER' as const
        }

        const result = updateMemberRoleSchema.parse(validData)
        expect(result.role).toBe('OWNER')
      })

      it('should validate with ADMIN role', () => {
        const validData = {
          role: 'ADMIN' as const
        }

        const result = updateMemberRoleSchema.parse(validData)
        expect(result.role).toBe('ADMIN')
      })

      it('should validate with MEMBER role', () => {
        const validData = {
          role: 'MEMBER' as const
        }

        const result = updateMemberRoleSchema.parse(validData)
        expect(result.role).toBe('MEMBER')
      })

      it('should validate all enum values', () => {
        const roles = ['OWNER', 'ADMIN', 'MEMBER'] as const

        roles.forEach(role => {
          const data = { role }
          const result = updateMemberRoleSchema.safeParse(data)
          expect(result.success).toBe(true)
          if (result.success) {
            expect(result.data.role).toBe(role)
          }
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when role is missing', () => {
        const invalidData = {}

        const result = updateMemberRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('role')
        }
      })

      it('should fail with invalid role value', () => {
        const invalidRoles = [
          'SUPERADMIN',
          'USER',
          'GUEST',
          'owner',
          'admin',
          'member',
          'Owner',
          ''
        ]

        invalidRoles.forEach(role => {
          const data = { role }
          const result = updateMemberRoleSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Role must be OWNER, ADMIN, or MEMBER')
          }
        })
      })

      it('should fail when role is null', () => {
        const invalidData = {
          role: null
        }

        const result = updateMemberRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when role is undefined', () => {
        const invalidData = {
          role: undefined
        }

        const result = updateMemberRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when role is a number', () => {
        const invalidData = {
          role: 1
        }

        const result = updateMemberRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail with empty string', () => {
        const invalidData = {
          role: ''
        }

        const result = updateMemberRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Role must be OWNER, ADMIN, or MEMBER')
        }
      })
    })

    describe('edge cases', () => {
      it('should not validate lowercase roles', () => {
        const data = {
          role: 'owner'
        }

        const result = updateMemberRoleSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should not validate mixed case roles', () => {
        const data = {
          role: 'Owner'
        }

        const result = updateMemberRoleSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should allow extra fields', () => {
        const data = {
          role: 'ADMIN' as const,
          extraField: 'ignored'
        }

        const result = updateMemberRoleSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('type safety', () => {
      it('should enforce enum type', () => {
        const validData = {
          role: 'OWNER' as const
        }

        const result = updateMemberRoleSchema.parse(validData)

        // TypeScript type check
        const role: 'OWNER' | 'ADMIN' | 'MEMBER' = result.role
        expect(role).toBe('OWNER')
      })

      it('should parse and validate correct enum values', () => {
        expect(() => updateMemberRoleSchema.parse({ role: 'OWNER' })).not.toThrow()
        expect(() => updateMemberRoleSchema.parse({ role: 'ADMIN' })).not.toThrow()
        expect(() => updateMemberRoleSchema.parse({ role: 'MEMBER' })).not.toThrow()
      })

      it('should throw for invalid enum values', () => {
        expect(() => updateMemberRoleSchema.parse({ role: 'INVALID' })).toThrow()
        expect(() => updateMemberRoleSchema.parse({ role: 'owner' })).toThrow()
      })
    })
  })
})
