import { CalendarController } from '../../../controllers/calendar.controller.tsoa';
import { titleService } from '../../../services/title.service';
import { userService } from '../../../services/user.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/title.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/auth');

describe('CalendarController (TSOA)', () => {
  let controller: CalendarController;
  let mockRequest: Partial<ExpressRequest>;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    controller = new CalendarController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getCalendarEvents', () => {
    const mockEvents = [
      {
        id: 'title-1',
        title: 'Event 1',
        scheduledDate: new Date('2025-02-15'),
        status: 'APPROVED',
        organizationId: 'org-123',
        aiGenerationContext: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'title-2',
        title: 'Event 2',
        scheduledDate: new Date('2025-02-20'),
        status: 'PENDING',
        organizationId: 'org-123',
        aiGenerationContext: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should get calendar events successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

      const result = await controller.getCalendarEvents(
        '2025',
        '02',
        'org-123',
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getCalendarEvents).toHaveBeenCalledWith('2025', '02', 'org-123');
      expect(result).toEqual(mockEvents);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getCalendarEvents('2025', '02', 'org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when year is missing', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.getCalendarEvents('', '02', 'org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(BadRequestError);

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when month is missing', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.getCalendarEvents('2025', '', 'org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(BadRequestError);

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when orgId is missing', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.getCalendarEvents('2025', '02', '', mockRequest as ExpressRequest)
      ).rejects.toThrow(BadRequestError);

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
    });

    it('should return empty array when no events found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockResolvedValue([]);

      const result = await controller.getCalendarEvents(
        '2025',
        '02',
        'org-123',
        mockRequest as ExpressRequest
      );

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.getCalendarEvents('2025', '02', 'org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Database error');
    });
  });
});
