import { z } from 'zod'

// Content settings creation/update schema
export const upsertContentSettingsSchema = z.object({
  // Strategy
  primaryKeywords: z.array(z.string().min(1)).min(1, 'At least one primary keyword is required').max(10, 'Too many primary keywords'),
  secondaryKeywords: z.array(z.string().min(1)).max(20, 'Too many secondary keywords').optional().default([]),
  postingDaysOfWeek: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], {
    message: 'Invalid day of week',
  })).optional().default([]),

  // Style & Audience
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'witty', 'educational'], {
    message: 'Invalid tone',
  }).optional(),
  targetAudience: z.string().max(200, 'Target audience description is too long').optional(),
  industry: z.string().max(100, 'Industry name is too long').optional(),
  goals: z.array(z.string().min(1)).max(10, 'Too many goals').optional().default([]),
  competitorUrls: z.array(z.string().url('Invalid competitor URL')).max(10, 'Too many competitor URLs').optional().default([]),
  topicsToAvoid: z.array(z.string().min(1)).max(20, 'Too many topics to avoid').optional().default([]),
  preferredLength: z.enum(['SHORT_FORM', 'MEDIUM_FORM', 'LONG_FORM'], {
    message: 'Invalid preferred length',
  }).optional(),
})

// Partial update schema (all fields optional)
export const updateContentSettingsSchema = upsertContentSettingsSchema.partial()

export type UpsertContentSettingsInput = z.infer<typeof upsertContentSettingsSchema>
export type UpdateContentSettingsInput = z.infer<typeof updateContentSettingsSchema>
