import { z } from 'zod'

// Generate titles request schema
export const generateTitlesSchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID'),
  context: z.string().max(500, 'Context is too long').optional(),
  count: z.number().int().min(1).max(20).optional().default(10),
})

// Update title schema
export const updateTitleSchema = z.object({
  title: z.string().min(5, 'Title is too short').max(200, 'Title is too long').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING'], {
    message: 'Invalid status',
  }).optional(),
  scheduledDate: z.string().datetime('Invalid date format').optional().or(z.null()),
})

// Bulk update titles schema
export const bulkUpdateTitlesSchema = z.object({
  titleIds: z.array(z.string().cuid('Invalid title ID')).min(1, 'At least one title ID is required').max(50, 'Too many titles'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Invalid status',
  }),
})

// Schedule title schema
export const scheduleTitleSchema = z.object({
  scheduledDate: z.string().datetime('Invalid date format'),
})

export type GenerateTitlesInput = z.infer<typeof generateTitlesSchema>
export type UpdateTitleInput = z.infer<typeof updateTitleSchema>
export type BulkUpdateTitlesInput = z.infer<typeof bulkUpdateTitlesSchema>
export type ScheduleTitleInput = z.infer<typeof scheduleTitleSchema>
