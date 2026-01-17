/**
 * API Types for tsoa documentation
 * These types are used to generate OpenAPI documentation
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  mission?: string;
  description?: string;
  websiteUrl?: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationRequest {
  /** Organization name (1-100 characters) */
  name: string;
  /** Organization mission statement (max 1000 characters) */
  mission?: string;
  /** Organization description (max 2000 characters) */
  description?: string;
  /** Organization website URL */
  websiteUrl?: string;
  /** Optional content settings to initialize */
  contentSettings?: ContentSettings;
}

export interface UpdateOrganizationRequest {
  /** Organization name (1-100 characters) */
  name?: string;
  /** Organization mission statement (max 1000 characters) */
  mission?: string;
  /** Organization description (max 2000 characters) */
  description?: string;
  /** Organization website URL */
  websiteUrl?: string;
}

export interface ContentSettings {
  id?: string;
  organizationId?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'witty' | 'educational';
  style?: string;
  targetAudience?: string;
  keywords?: string[];
  contentPillars?: string[];
  voicePersonality?: string;
  writingGuidelines?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateContentSettingsRequest {
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'witty' | 'educational';
  style?: string;
  targetAudience?: string;
  keywords?: string[];
  contentPillars?: string[];
  voicePersonality?: string;
  writingGuidelines?: string;
}

export interface BlogTitle {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  targetKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogOutline {
  id: string;
  organizationId: string;
  blogTitleId: string;
  outline: any; // JSON structure
  createdAt: Date;
  updatedAt: Date;
}

export interface Blog {
  id: string;
  organizationId: string;
  blogOutlineId: string;
  title: string;
  content: string;
  htmlContent?: string;
  metaDescription?: string;
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: 'GENERATE_TITLES' | 'GENERATE_OUTLINE' | 'GENERATE_BLOG';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  organizationId: string;
  resultId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateTitleJobRequest {
  /** Organization ID */
  organizationId: string;
  /** Dates for title generation */
  dates: string[];
  /** Additional instructions for the AI */
  additionalInstructions?: string;
}

export interface CreateOutlineJobRequest {
  /** Blog title ID to generate outline for */
  blogTitleId: string;
  /** Additional instructions for the AI */
  additionalInstructions?: string;
}

export interface CreateBlogJobRequest {
  /** Blog outline ID to generate blog from */
  blogOutlineId: string;
  /** Additional instructions for the AI */
  additionalInstructions?: string;
}

export interface JobResponse {
  status: 'accepted';
  data: Job;
}

export interface CalendarEvent {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  platform?: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'CANCELLED';
  blogId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database?: 'connected' | 'disconnected';
  redis?: 'connected' | 'disconnected';
}
