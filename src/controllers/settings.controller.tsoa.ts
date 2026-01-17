import {
  Route,
  Get,
  Post,
  Path,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
  Request,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import { ContentSettings, ErrorResponse } from '../types/api.types';
import { settingsService } from '../services/settings.service';
import { getUserId } from '../utils/auth';

interface UpsertSettingsRequest {
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'witty' | 'educational';
  style?: string;
  targetAudience?: string;
  keywords?: string[];
  contentPillars?: string[];
  voicePersonality?: string;
  writingGuidelines?: string;
}

@Route('organizations/{orgId}/settings')
@Tags('Settings')
@Security('clerk')
export class SettingsController {
  /**
   * Get content settings for an organization
   * @summary Get settings
   * @param orgId Organization ID
   * @returns Content settings or null if not found
   */
  @Get()
  @SuccessResponse(200, 'Success')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getSettings(
    @Path() orgId: string,
    @Request() request: ExpressRequest
  ): Promise<any> {
    getUserId(request); // Validate authentication
    return settingsService.getByOrgId(orgId);
  }

  /**
   * Create or update content settings for an organization
   * @summary Upsert settings
   * @param orgId Organization ID
   * @param requestBody Settings data
   * @returns Updated content settings
   */
  @Post()
  @SuccessResponse(200, 'Settings upserted successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async upsertSettings(
    @Path() orgId: string,
    @Body() requestBody: UpsertSettingsRequest,
    @Request() request: ExpressRequest
  ): Promise<any> {
    getUserId(request); // Validate authentication
    return settingsService.upsert(orgId, requestBody);
  }
}
