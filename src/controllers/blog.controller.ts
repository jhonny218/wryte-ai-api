import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';
import { successResponse } from '../utils/response';
import { blogService } from '../services/blog.service';

export class BlogController {
  async getBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId } = req.params

      const blogs = await blogService.getBlogs(orgId!);
      return successResponse(res, blogs)
    } catch (error) {
      next(error);
    }
  }

  async updateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId, blogId } = req.params
      const body = req.body

      // Normalize and validate input before passing to service
      const updateData: any = {}
      if (body.content !== undefined) updateData.content = String(body.content)
      if (body.htmlContent !== undefined) updateData.htmlContent = String(body.htmlContent)
      if (body.wordCount !== undefined) updateData.wordCount = Number(body.wordCount)
      if (body.status !== undefined) {
        const allowed = ['DRAFT', 'PUBLISHED', 'ARCHIVED']
        if (!allowed.includes(body.status)) throw new UnauthorizedError('Invalid status value')
        updateData.status = body.status
      }

      const updatedBlog = await blogService.updateBlog(orgId!, blogId!, updateData);
      return successResponse(res, updatedBlog, 'Blog updated successfully')
    }
    catch (error) {
      next(error);
    }
  }

  async deleteBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId, blogId } = req.params

      await blogService.deleteBlog(orgId!, blogId!);
      return successResponse(res, null, 'Blog deleted successfully')
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();