import { Request, Response, NextFunction } from 'express';
import { titleService } from '../services/title.service';
import { getAuth } from '@clerk/express';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';
import { successResponse } from '../utils/response';

export class TitleController {
  async getTitles(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')

      const { orgId } = req.params

      const titles = await titleService.getTitles(orgId!);
      return successResponse(res, titles)
    } catch (error) {
      next(error);
    }
  }
}

export const titleController = new TitleController();
