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
import { blogService } from '../services/blog.service';
import { userService } from '../services/user.service';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { getUserId } from '../utils/auth';

interface Blog {
  id: string;
  blogOutlineId: string;
  content: string;
  htmlContent: string;
  wordCount: number;
  status: string;
  publishedAt: Date | null;
  exportedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateBlogRequest {
  content?: string;
  htmlContent?: string;
  wordCount?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

@Route('organizations/{orgId}/blogs')
@Tags('Blogs')
@Security('clerk')
export class BlogsController {
  /**
   * Get all blogs for an organization
   * @summary List blogs
   * @param orgId Organization ID
   * @returns List of blogs
   */
  @Get()
  @SuccessResponse(200, 'Success')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async getBlogs(
    @Path() orgId: string,
    @Request() request: ExpressRequest
  ): Promise<Blog[]> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    return blogService.getBlogs(orgId);
  }

  /**
   * Update a blog
   * @summary Update blog
   * @param orgId Organization ID
   * @param blogId Blog ID
   * @param requestBody Update data
   * @returns Updated blog
   */
  @Patch('{blogId}')
  @SuccessResponse(200, 'Blog updated successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async updateBlog(
    @Path() orgId: string,
    @Path() blogId: string,
    @Body() requestBody: UpdateBlogRequest,
    @Request() request: ExpressRequest
  ): Promise<Blog> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    // Normalize and validate input
    const updateData: any = {};
    if (requestBody.content !== undefined) updateData.content = String(requestBody.content);
    if (requestBody.htmlContent !== undefined) updateData.htmlContent = String(requestBody.htmlContent);
    if (requestBody.wordCount !== undefined) updateData.wordCount = Number(requestBody.wordCount);
    if (requestBody.status !== undefined) {
      const allowed = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
      if (!allowed.includes(requestBody.status)) throw new BadRequestError('Invalid status value');
      updateData.status = requestBody.status;
    }

    return blogService.updateBlog(orgId, blogId, updateData);
  }

  /**
   * Delete a blog
   * @summary Delete blog
   * @param orgId Organization ID
   * @param blogId Blog ID
   * @returns Success message
   */
  @Delete('{blogId}')
  @SuccessResponse(200, 'Blog deleted successfully')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(404, 'Not found')
  public async deleteBlog(
    @Path() orgId: string,
    @Path() blogId: string,
    @Request() request: ExpressRequest
  ): Promise<{ message: string }> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    await blogService.deleteBlog(orgId, blogId);
    return { message: 'Blog deleted successfully' };
  }
}
