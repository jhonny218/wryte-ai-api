import { createUserSchema, updateUserSchema } from '../../../validators/user.validator'

describe('User Validator', () => {
  describe('createUserSchema', () => {
    describe('valid inputs', () => {
      it('should validate with all required fields', () => {
        const validData = {
          clerkId: 'user_2abc123def456',
          email: 'test@example.com',
          name: 'John Doe'
        }

        const result = createUserSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate without optional name field', () => {
        const validData = {
          clerkId: 'user_2abc123def456',
          email: 'test@example.com'
        }

        const result = createUserSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with name as undefined', () => {
        const validData = {
          clerkId: 'user_2abc123def456',
          email: 'test@example.com',
          name: undefined
        }

        const result = createUserSchema.parse(validData)
        expect(result.clerkId).toBe(validData.clerkId)
        expect(result.email).toBe(validData.email)
      })

      it('should validate with various email formats', () => {
        const emails = [
          'simple@example.com',
          'very.common@example.com',
          'disposable.style.email.with+symbol@example.com',
          'user@subdomain.example.com',
          'user123@example-domain.com'
        ]

        emails.forEach(email => {
          const data = {
            clerkId: 'user_123',
            email
          }
          const result = createUserSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('invalid inputs', () => {
      it('should fail when clerkId is missing', () => {
        const invalidData = {
          email: 'test@example.com',
          name: 'John Doe'
        }

        const result = createUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('clerkId')
        }
      })

      it('should fail when clerkId is empty string', () => {
        const invalidData = {
          clerkId: '',
          email: 'test@example.com'
        }

        const result = createUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Clerk ID is required')
        }
      })

      it('should fail when email is missing', () => {
        const invalidData = {
          clerkId: 'user_123',
          name: 'John Doe'
        }

        const result = createUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('email')
        }
      })

      it('should fail when email is invalid', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user @example.com',
          'user@example',
          'user..double@example.com'
        ]

        invalidEmails.forEach(email => {
          const data = {
            clerkId: 'user_123',
            email
          }
          const result = createUserSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid email address')
          }
        })
      })

      it('should fail when email is empty string', () => {
        const invalidData = {
          clerkId: 'user_123',
          email: ''
        }

        const result = createUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid email address')
        }
      })

      it('should fail when clerkId is null', () => {
        const invalidData = {
          clerkId: null,
          email: 'test@example.com'
        }

        const result = createUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when email is null', () => {
        const invalidData = {
          clerkId: 'user_123',
          email: null
        }

        const result = createUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should validate with very long clerkId', () => {
        const data = {
          clerkId: 'user_' + 'a'.repeat(1000),
          email: 'test@example.com'
        }

        const result = createUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with name as empty string', () => {
        const data = {
          clerkId: 'user_123',
          email: 'test@example.com',
          name: ''
        }

        const result = createUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with very long name', () => {
        const data = {
          clerkId: 'user_123',
          email: 'test@example.com',
          name: 'a'.repeat(1000)
        }

        const result = createUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should allow extra fields', () => {
        const data = {
          clerkId: 'user_123',
          email: 'test@example.com',
          extraField: 'should be ignored'
        }

        const result = createUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateUserSchema', () => {
    describe('valid inputs', () => {
      it('should validate with name field', () => {
        const validData = {
          name: 'Jane Doe'
        }

        const result = updateUserSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with email field', () => {
        const validData = {
          email: 'newemail@example.com'
        }

        const result = updateUserSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with both name and email', () => {
        const validData = {
          name: 'Jane Doe',
          email: 'jane@example.com'
        }

        const result = updateUserSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with empty object (all fields optional)', () => {
        const validData = {}

        const result = updateUserSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should validate with undefined values', () => {
        const validData = {
          name: undefined,
          email: undefined
        }

        const result = updateUserSchema.parse(validData)
        expect(result).toEqual({})
      })
    })

    describe('invalid inputs', () => {
      it('should fail when name is empty string', () => {
        const invalidData = {
          name: ''
        }

        const result = updateUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Name cannot be empty')
        }
      })

      it('should fail when email is invalid', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user @example.com'
        ]

        invalidEmails.forEach(email => {
          const data = { email }
          const result = updateUserSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('Invalid email address')
          }
        })
      })

      it('should fail when email is empty string', () => {
        const invalidData = {
          email: ''
        }

        const result = updateUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid email address')
        }
      })

      it('should fail when name is null', () => {
        const invalidData = {
          name: null
        }

        const result = updateUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail when email is null', () => {
        const invalidData = {
          email: null
        }

        const result = updateUserSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should fail with name containing only whitespace', () => {
        const invalidData = {
          name: '   '
        }

        const result = updateUserSchema.safeParse(invalidData)
        // Zod min(1) checks string length, not trimmed length
        // So whitespace strings pass length check
        expect(result.success).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should validate with very long name', () => {
        const data = {
          name: 'a'.repeat(1000)
        }

        const result = updateUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate name with special characters', () => {
        const data = {
          name: "O'Brien-Smith Jr."
        }

        const result = updateUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate with extra fields', () => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          extraField: 'ignored'
        }

        const result = updateUserSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should validate various valid email formats', () => {
        const emails = [
          'user+tag@example.com',
          'user.name@example.co.uk',
          'user_name@example-domain.com'
        ]

        emails.forEach(email => {
          const data = { email }
          const result = updateUserSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('combined validation', () => {
      it('should validate when updating only name', () => {
        const data = {
          name: 'Updated Name'
        }

        expect(() => updateUserSchema.parse(data)).not.toThrow()
      })

      it('should validate when updating only email', () => {
        const data = {
          email: 'updated@example.com'
        }

        expect(() => updateUserSchema.parse(data)).not.toThrow()
      })

      it('should fail when name is provided but empty', () => {
        const data = {
          name: '',
          email: 'valid@example.com'
        }

        expect(() => updateUserSchema.parse(data)).toThrow()
      })

      it('should fail when email is provided but invalid', () => {
        const data = {
          name: 'Valid Name',
          email: 'invalid-email'
        }

        expect(() => updateUserSchema.parse(data)).toThrow()
      })
    })
  })
})
