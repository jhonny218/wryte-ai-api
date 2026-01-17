import {
  Route,
  Get,
  Patch,
  Delete,
  Path,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
  Request,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import { ErrorResponse } from '../types/api.types';
import { titleService } from '../services/title.service';
import { userService } from '../services/user.service';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { getUserId } from '../utils/auth';

interface BlogTitle {
  id: string;
  organizationId: string;
  title: string;
  status: string;
  scheduledDate?: Date | null;
  aiGenerationContext?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateTitleRequest {
  title?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REGENERATING';
  scheduledDate?: string | null;
  aiGenerationContext?: any;
}

@Route('organizations/{orgId}/titles')
@Tags('Titles')
@Security('clerk')
export class TitlesController {
  /**
   * Get all blog titles for an organization
   * @summary List blog titles
   * @param orgId Organization ID
   * @returns List of blog titles
   */
  @Get()
  @SuccessResponse(200, 'Success')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async getTitles(
    @Path() orgId: string,
    @Request() request: ExpressRequest
  ): Promise<BlogTitle[]> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    return titleService.getTitles(orgId);
  }

  /**
   * Update a blog title
   * @summary Update blog title
   * @param orgId Organization ID
   * @param titleId Title ID
   * @param requestBody Update data
   * @returns Updated blog title
   */
  @Patch('{titleId}')
  @SuccessResponse(200, 'Title updated successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async updateTitle(
    @Path() orgId: string,
    @Path() titleId: string,
    @Body() requestBody: UpdateTitleRequest,
    @Request() request: ExpressRequest
  ): Promise<BlogTitle> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    // Normalize and validate input
    const updateData: any = {};
    if (requestBody.title !== undefined) updateData.title = String(requestBody.title);
    if (requestBody.status !== undefined) {
      const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING'];
      if (!allowed.includes(requestBody.status)) throw new BadRequestError('Invalid status value');
      updateData.status = requestBody.status;
    }
    if (requestBody.scheduledDate !== undefined) {
      if (requestBody.scheduledDate === null || requestBody.scheduledDate === '') {
        updateData.scheduledDate = null;
      } else {
        const d = new Date(requestBody.scheduledDate);
        if (Number.isNaN(d.getTime())) throw new BadRequestError('Invalid scheduledDate');
        updateData.scheduledDate = d;
      }
    }
    if (requestBody.aiGenerationContext !== undefined) {
      updateData.aiGenerationContext = requestBody.aiGenerationContext;
    }

    return titleService.updateTitle(orgId, titleId, updateData);
  }

  /**
   * Delete a blog title
   * @summary Delete blog title
   * @param orgId Organization ID
   * @param titleId Title ID
   * @returns Success message
   */
  @Delete('{titleId}')
  @SuccessResponse(200, 'Title deleted successfully')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async deleteTitle(
    @Path() orgId: string,
    @Path() titleId: string,
    @Request() request: ExpressRequest
  ): Promise<{ message: string }> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    await titleService.deleteTitle(orgId, titleId);
    return { message: 'Title deleted successfully' };
  }
}
