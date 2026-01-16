import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';
import { successResponse } from '../utils/response';
import { outlineService } from '../services/outline.service';
import { getUserId } from '../utils/auth';

export class OutlineController {
  async getOutlines(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId } = req.params

      const outlines = await outlineService.getOutlines(orgId!);
      return successResponse(res, outlines)
    } catch (error) {
      next(error);
    }
  }

  async updateOutline(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId, outlineId } = req.params
      const body = req.body

      // Normalize and validate input before passing to service
      const updateData: any = {}
      if (body.structure !== undefined) updateData.structure = body.structure
      if (body.seoKeywords !== undefined) updateData.seoKeywords = body.seoKeywords
      if (body.metaDescription !== undefined) updateData.metaDescription = String(body.metaDescription)
      if (body.suggestedImages !== undefined) updateData.suggestedImages = body.suggestedImages
      if (body.status !== undefined) {
        const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING']
        if (!allowed.includes(body.status)) throw new UnauthorizedError('Invalid status value')
        updateData.status = body.status
      }

      const updatedOutline = await outlineService.updateOutline(orgId!, outlineId!, updateData);
      return successResponse(res, updatedOutline, 'Outline updated successfully')
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOutline(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId, outlineId } = req.params

      await outlineService.deleteOutline(orgId!, outlineId!);
      return successResponse(res, null, 'Outline deleted successfully')
    } catch (error) {
      next(error);
    }
  }
}

export const outlineController = new OutlineController();