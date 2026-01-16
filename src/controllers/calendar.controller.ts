import { Request, Response, NextFunction } from 'express';
import { titleService } from '../services/title.service';
import { userService } from '../services/user.service';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { successResponse } from '../utils/response';
import { getUserId } from '../utils/auth';

export class CalendarController {
  async getCalendarEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const clerkId = getUserId(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')
      // Read inputs from query string (e.g. ?year=2025&month=02&orgId=...) or params
      const year = String((req.query.year ?? req.params.year) || '')
      const month = String((req.query.month ?? req.params.month) || '')
      const orgId = String((req.query.orgId ?? req.params.orgId) || '')

      if (!year || !month || !orgId) {
        throw new BadRequestError('Missing required query parameters: year, month, orgId')
      }

      const events = await titleService.getCalendarEvents(year, month, orgId!);
      return successResponse(res, events)
    } catch (error) {
      next(error);
    }
  }
}

export const calendarController = new CalendarController();