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
import { outlineService } from '../services/outline.service';
import { userService } from '../services/user.service';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { getUserId } from '../utils/auth';

interface BlogOutline {
  id: string;
  blogTitleId: string;
  structure?: any;
  seoKeywords?: string[];
  metaDescription?: string | null;
  suggestedImages?: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateOutlineRequest {
  structure?: any;
  seoKeywords?: string[];
  metaDescription?: string;
  suggestedImages?: string[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REGENERATING';
}

@Route('organizations/{orgId}/outlines')
@Tags('Outlines')
@Security('clerk')
export class OutlinesController {
  /**
   * Get all blog outlines for an organization
   * @summary List blog outlines
   * @param orgId Organization ID
   * @returns List of blog outlines
   */
  @Get()
  @SuccessResponse(200, 'Success')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async getOutlines(
    @Path() orgId: string,
    @Request() request: ExpressRequest
  ): Promise<BlogOutline[]> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    return outlineService.getOutlines(orgId);
  }

  /**
   * Update a blog outline
   * @summary Update blog outline
   * @param orgId Organization ID
   * @param outlineId Outline ID
   * @param requestBody Update data
   * @returns Updated blog outline
   */
  @Patch('{outlineId}')
  @SuccessResponse(200, 'Outline updated successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async updateOutline(
    @Path() orgId: string,
    @Path() outlineId: string,
    @Body() requestBody: UpdateOutlineRequest,
    @Request() request: ExpressRequest
  ): Promise<BlogOutline> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    // Normalize and validate input
    const updateData: any = {};
    if (requestBody.structure !== undefined) updateData.structure = requestBody.structure;
    if (requestBody.seoKeywords !== undefined) updateData.seoKeywords = requestBody.seoKeywords;
    if (requestBody.metaDescription !== undefined) {
      updateData.metaDescription = String(requestBody.metaDescription);
    }
    if (requestBody.suggestedImages !== undefined) {
      updateData.suggestedImages = requestBody.suggestedImages;
    }
    if (requestBody.status !== undefined) {
      const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING'];
      if (!allowed.includes(requestBody.status)) throw new BadRequestError('Invalid status value');
      updateData.status = requestBody.status;
    }

    return outlineService.updateOutline(orgId, outlineId, updateData);
  }

  /**
   * Delete a blog outline
   * @summary Delete blog outline
   * @param orgId Organization ID
   * @param outlineId Outline ID
   * @returns Success message
   */
  @Delete('{outlineId}')
  @SuccessResponse(200, 'Outline deleted successfully')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async deleteOutline(
    @Path() orgId: string,
    @Path() outlineId: string,
    @Request() request: ExpressRequest
  ): Promise<{ message: string }> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    await outlineService.deleteOutline(orgId, outlineId);
    return { message: 'Outline deleted successfully' };
  }
}
