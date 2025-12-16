import { z } from 'zod'

// User creation schema (for internal use)
export const createUserSchema = z.object({
  clerkId: z.string().min(1, 'Clerk ID is required'),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
})

// User update schema
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Invalid email address').optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
