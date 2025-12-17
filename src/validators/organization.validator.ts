import { z } from 'zod'
import { upsertContentSettingsSchema } from './settings.validator'

// Organization creation schema (with optional nested content settings)
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name is too long'),
  mission: z.string().max(1000, 'Mission is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  contentSettings: upsertContentSettingsSchema.optional(),
})

// Organization update schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name cannot be empty').max(100, 'Name is too long').optional(),
  mission: z.string().max(1000, 'Mission is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

// Organization member role update schema
export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER'], {
    message: 'Role must be OWNER, ADMIN, or MEMBER',
  }),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
