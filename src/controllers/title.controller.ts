import { Request, Response, NextFunction } from 'express';
import { titleService } from '../services/title.service';
import { userService } from '../services/user.service';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { successResponse } from '../utils/response';
import { getUserId } from '../utils/auth';

export class TitleController {
  async getTitles(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId } = req.params

      const titles = await titleService.getTitles(orgId!);
      return successResponse(res, titles)
    } catch (error) {
      next(error);
    }
  }

  async updateTitle(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId, titleId } = req.params
      const body = req.body

      // Normalize and validate input before passing to service
      const updateData: any = {}
      if (body.title !== undefined) updateData.title = String(body.title)
      if (body.status !== undefined) {
        const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'REGENERATING']
        if (!allowed.includes(body.status)) throw new BadRequestError('Invalid status value')
        updateData.status = body.status
      }
      if (body.scheduledDate !== undefined) {
        if (body.scheduledDate === null || body.scheduledDate === '') {
          updateData.scheduledDate = null
        } else {
          const d = new Date(body.scheduledDate)
          if (Number.isNaN(d.getTime())) throw new BadRequestError('Invalid scheduledDate')
          updateData.scheduledDate = d
        }
      }
      if (body.aiGenerationContext !== undefined) updateData.aiGenerationContext = body.aiGenerationContext

      const updatedTitle = await titleService.updateTitle(orgId!, titleId!, updateData);
      return successResponse(res, updatedTitle, 'Title updated successfully')
    } catch (error) {
      next(error);
    }
  }

  async deleteTitle(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId, titleId } = req.params

      await titleService.deleteTitle(orgId!, titleId!);
      return successResponse(res, null, 'Title deleted successfully')
    } catch (error) {
      next(error);
    }
  }
}

export const titleController = new TitleController();
