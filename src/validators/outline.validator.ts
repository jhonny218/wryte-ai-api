import { z } from 'zod'

// Generate outline request schema
export const generateOutlineSchema = z.object({
  blogTitleId: z.string().cuid('Invalid blog title ID'),
  additionalInstructions: z.string().max(1000, 'Instructions are too long').optional(),
})

// Update outline schema
export const updateOutlineSchema = z.object({
  structure: z.record(z.string(), z.any()).optional(), // JSON structure for outline
  seoKeywords: z.array(z.string().min(1)).max(20, 'Too many SEO keywords').optional(),
  metaDescription: z.string().min(50, 'Meta description is too short').max(160, 'Meta description is too long').optional(),
  suggestedImages: z.array(z.string()).max(10, 'Too many suggested images').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING'], {
    message: 'Invalid status',
  }).optional(),
})

// Approve outline schema
export const approveOutlineSchema = z.object({
  status: z.literal('APPROVED'),
})

// Reject outline schema
export const rejectOutlineSchema = z.object({
  status: z.literal('REJECTED'),
  feedback: z.string().max(500, 'Feedback is too long').optional(),
})

export type GenerateOutlineInput = z.infer<typeof generateOutlineSchema>
export type UpdateOutlineInput = z.infer<typeof updateOutlineSchema>
export type ApproveOutlineInput = z.infer<typeof approveOutlineSchema>
export type RejectOutlineInput = z.infer<typeof rejectOutlineSchema>
