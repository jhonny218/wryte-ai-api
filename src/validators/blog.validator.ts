import { z } from 'zod'

// Generate blog request schema
export const generateBlogSchema = z.object({
  blogOutlineId: z.string().cuid('Invalid blog outline ID'),
  additionalInstructions: z.string().max(1000, 'Instructions are too long').optional(),
})

// Update blog schema
export const updateBlogSchema = z.object({
  content: z.string().min(100, 'Content is too short').max(50000, 'Content is too long').optional(),
  htmlContent: z.string().min(100, 'HTML content is too short').max(100000, 'HTML content is too long').optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'PUBLISHED', 'EXPORTED'], {
    message: 'Invalid status',
  }).optional(),
})

// Publish blog schema
export const publishBlogSchema = z.object({
  status: z.literal('PUBLISHED'),
  publishedAt: z.coerce.date({ message: 'Invalid date format' }).optional(),
})

// Export blog schema
export const exportBlogSchema = z.object({
  format: z.enum(['PDF', 'DOCX', 'HTML', 'MARKDOWN'], {
    message: 'Invalid export format',
  }),
})

// Approve blog schema
export const approveBlogSchema = z.object({
  status: z.literal('APPROVED'),
})

export type GenerateBlogInput = z.infer<typeof generateBlogSchema>
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>
export type PublishBlogInput = z.infer<typeof publishBlogSchema>
export type ExportBlogInput = z.infer<typeof exportBlogSchema>
export type ApproveBlogInput = z.infer<typeof approveBlogSchema>
