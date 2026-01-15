import { Request, Response, NextFunction } from 'express';
import { calendarController } from '../../../controllers/calendar.controller';
import { titleService } from '../../../services/title.service';
import { userService } from '../../../services/user.service';
import { successResponse } from '../../../utils/response';
import { getAuth } from '@clerk/express';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';

jest.mock('../../../services/title.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/response');
jest.mock('@clerk/express');

describe('CalendarController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();

    // Mock getAuth to return clerk user ID
    (getAuth as jest.Mock).mockReturnValue({ userId: 'clerk-123' });
  });

  describe('getCalendarEvents', () => {
    it('should get calendar events successfully with query params', async () => {
      const year = '2025';
      const month = '02';
      const orgId = 'org-123';
      const mockEvents = [
        {
          id: 'title-1',
          title: 'Event 1',
          scheduledDate: new Date('2025-02-15'),
          status: 'APPROVED',
        },
        {
          id: 'title-2',
          title: 'Event 2',
          scheduledDate: new Date('2025-02-20'),
          status: 'PENDING',
        },
      ];

      mockReq.query = { year, month, orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getCalendarEvents).toHaveBeenCalledWith(year, month, orgId);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockEvents);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should get calendar events successfully with params', async () => {
      const year = '2025';
      const month = '03';
      const orgId = 'org-456';
      const mockEvents = [
        {
          id: 'title-3',
          title: 'Event 3',
          scheduledDate: new Date('2025-03-10'),
          status: 'APPROVED',
        },
      ];

      mockReq.params = { year, month, orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getCalendarEvents).toHaveBeenCalledWith(year, month, orgId);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockEvents);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should prioritize query params over route params', async () => {
      const queryYear = '2025';
      const queryMonth = '02';
      const queryOrgId = 'org-query';
      const mockEvents: any[] = [];

      mockReq.query = { year: queryYear, month: queryMonth, orgId: queryOrgId };
      mockReq.params = { year: '2024', month: '01', orgId: 'org-params' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockResolvedValue(mockEvents);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.getCalendarEvents).toHaveBeenCalledWith(
        queryYear,
        queryMonth,
        queryOrgId
      );
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockEvents);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when year is missing', async () => {
      mockReq.query = { month: '02', orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when month is missing', async () => {
      mockReq.query = { year: '2025', orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when orgId is missing', async () => {
      mockReq.query = { year: '2025', month: '02' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when all params are missing', async () => {
      mockReq.query = {};

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      mockReq.query = { year: '2025', month: '02', orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(titleService.getCalendarEvents).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.query = { year: '2025', month: '02', orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (titleService.getCalendarEvents as jest.Mock).mockRejectedValue(error);

      await calendarController.getCalendarEvents(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
