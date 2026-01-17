import {
  Route,
  Get,
  Query,
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

interface CalendarEvent {
  id: string;
  title: string;
  scheduledDate: Date | null;
  status: string;
  organizationId: string;
  aiGenerationContext: any;
  createdAt: Date;
  updatedAt: Date;
}

@Route('calendar')
@Tags('Calendar')
@Security('clerk')
export class CalendarController {
  /**
   * Get calendar events for a specific year and month
   * @summary Get calendar events
   * @param year Year (e.g., "2025")
   * @param month Month (e.g., "02")
   * @param orgId Organization ID
   * @returns List of calendar events
   */
  @Get('events')
  @SuccessResponse(200, 'Success')
  @Response<ErrorResponse>(400, 'Missing required parameters')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getCalendarEvents(
    @Query() year: string,
    @Query() month: string,
    @Query() orgId: string,
    @Request() request: ExpressRequest
  ): Promise<CalendarEvent[]> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    if (!year || !month || !orgId) {
      throw new BadRequestError('Missing required query parameters: year, month, orgId');
    }

    return titleService.getCalendarEvents(year, month, orgId);
  }
}
