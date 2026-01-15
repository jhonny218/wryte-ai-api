import { TitleService } from '../../../services/title.service';
import { prisma } from '../../../utils/prisma';
import { NotFoundError, ForbiddenError } from '../../../utils/errors';
import { TitleStatus } from '../../../../generated/prisma/client';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    blogTitle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contentSettings: {
      findUnique: jest.fn(),
    },
  },
}));

describe('TitleService', () => {
  let titleService: TitleService;
  const mockOrgId = 'org-123';
  const mockTitleId = 'title-123';

  beforeEach(() => {
    titleService = new TitleService();
    jest.clearAllMocks();
  });

  describe('getTitles', () => {
    it('should return all titles for an organization', async () => {
      const mockTitles = [
        {
          id: 'title-1',
          organizationId: mockOrgId,
          title: 'Test Title 1',
          status: TitleStatus.PENDING,
          scheduledDate: new Date(),
          outline: null,
        },
        {
          id: 'title-2',
          organizationId: mockOrgId,
          title: 'Test Title 2',
          status: TitleStatus.PENDING,
          scheduledDate: new Date(),
          outline: { id: 'outline-1' },
        },
      ];

      (prisma.blogTitle.findMany as jest.Mock).mockResolvedValue(mockTitles);

      const result = await titleService.getTitles(mockOrgId);

      expect(prisma.blogTitle.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
        include: { outline: true },
        orderBy: { scheduledDate: 'desc' },
      });
      expect(result).toEqual(mockTitles);
    });
  });

  describe('createTitlesWithDates', () => {
    it('should create multiple titles with dates', async () => {
      const items: { title: string; date: Date }[] = [
        { title: 'Title 1', date: new Date('2024-01-01') },
        { title: 'Title 2', date: new Date('2024-01-02') },
      ];

      (prisma.blogTitle.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await titleService.createTitlesWithDates(mockOrgId, items);

      expect(prisma.blogTitle.createMany).toHaveBeenCalledWith({
        data: [
          {
            organizationId: mockOrgId,
            title: 'Title 1',
            status: TitleStatus.PENDING,
            scheduledDate: items[0]!.date,
          },
          {
            organizationId: mockOrgId,
            title: 'Title 2',
            status: TitleStatus.PENDING,
            scheduledDate: items[1]!.date,
          },
        ],
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should return undefined when items array is empty', async () => {
      const result = await titleService.createTitlesWithDates(mockOrgId, []);

      expect(prisma.blogTitle.createMany).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('createTitles', () => {
    it('should create titles with scheduled date', async () => {
      const titles = ['Title 1', 'Title 2'];
      const scheduledDate = new Date('2024-01-01');

      (prisma.blogTitle.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await titleService.createTitles(mockOrgId, titles, scheduledDate);

      expect(prisma.blogTitle.createMany).toHaveBeenCalledWith({
        data: [
          {
            organizationId: mockOrgId,
            title: 'Title 1',
            status: TitleStatus.PENDING,
            scheduledDate,
          },
          {
            organizationId: mockOrgId,
            title: 'Title 2',
            status: TitleStatus.PENDING,
            scheduledDate,
          },
        ],
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should create titles without scheduled date', async () => {
      const titles = ['Title 1'];

      (prisma.blogTitle.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await titleService.createTitles(mockOrgId, titles);

      expect(prisma.blogTitle.createMany).toHaveBeenCalledWith({
        data: [
          {
            organizationId: mockOrgId,
            title: 'Title 1',
            status: TitleStatus.PENDING,
            scheduledDate: null,
          },
        ],
      });
    });

    it('should return undefined when titles array is empty', async () => {
      const result = await titleService.createTitles(mockOrgId, []);

      expect(prisma.blogTitle.createMany).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('updateTitle', () => {
    const mockTitle = {
      id: mockTitleId,
      organizationId: mockOrgId,
      title: 'Original Title',
      status: TitleStatus.PENDING,
      scheduledDate: null,
    };

    it('should update title successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        status: TitleStatus.APPROVED,
        scheduledDate: new Date('2024-01-01'),
      };
      const updatedTitle = { ...mockTitle, ...updateData };

      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(mockTitle);
      (prisma.blogTitle.update as jest.Mock).mockResolvedValue(updatedTitle);

      const result = await titleService.updateTitle(mockOrgId, mockTitleId, updateData);

      expect(prisma.blogTitle.update).toHaveBeenCalledWith({
        where: { id: mockTitleId },
        data: updateData,
      });
      expect(result).toEqual(updatedTitle);
    });

    it('should update only provided fields', async () => {
      const updateData = { status: TitleStatus.APPROVED };

      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(mockTitle);
      (prisma.blogTitle.update as jest.Mock).mockResolvedValue({
        ...mockTitle,
        ...updateData,
      });

      await titleService.updateTitle(mockOrgId, mockTitleId, updateData);

      expect(prisma.blogTitle.update).toHaveBeenCalledWith({
        where: { id: mockTitleId },
        data: { status: TitleStatus.APPROVED },
      });
    });

    it('should throw NotFoundError when title does not exist', async () => {
      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        titleService.updateTitle(mockOrgId, mockTitleId, { title: 'New' })
      ).rejects.toThrow(NotFoundError);
      await expect(
        titleService.updateTitle(mockOrgId, mockTitleId, { title: 'New' })
      ).rejects.toThrow('Title not found');
      expect(prisma.blogTitle.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when organization does not match', async () => {
      const titleFromDifferentOrg = { ...mockTitle, organizationId: 'different-org' };
      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(titleFromDifferentOrg);

      await expect(
        titleService.updateTitle(mockOrgId, mockTitleId, { title: 'New' })
      ).rejects.toThrow(ForbiddenError);
      await expect(
        titleService.updateTitle(mockOrgId, mockTitleId, { title: 'New' })
      ).rejects.toThrow('You do not have permission to update this title');
      expect(prisma.blogTitle.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTitle', () => {
    const mockTitle = {
      id: mockTitleId,
      organizationId: mockOrgId,
      title: 'Test Title',
      status: TitleStatus.PENDING,
    };

    it('should delete title successfully', async () => {
      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(mockTitle);
      (prisma.blogTitle.delete as jest.Mock).mockResolvedValue(mockTitle);

      await titleService.deleteTitle(mockOrgId, mockTitleId);

      expect(prisma.blogTitle.delete).toHaveBeenCalledWith({
        where: { id: mockTitleId },
      });
    });

    it('should throw NotFoundError when title does not exist', async () => {
      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(titleService.deleteTitle(mockOrgId, mockTitleId)).rejects.toThrow(
        NotFoundError
      );
      expect(prisma.blogTitle.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when organization does not match', async () => {
      const titleFromDifferentOrg = { ...mockTitle, organizationId: 'different-org' };
      (prisma.blogTitle.findUnique as jest.Mock).mockResolvedValue(titleFromDifferentOrg);

      await expect(titleService.deleteTitle(mockOrgId, mockTitleId)).rejects.toThrow(
        ForbiddenError
      );
      expect(prisma.blogTitle.delete).not.toHaveBeenCalled();
    });
  });

  describe('getContentSettings', () => {
    it('should return content settings for organization', async () => {
      const mockSettings = {
        id: 'settings-1',
        organizationId: mockOrgId,
        primaryKeywords: ['keyword1'],
      };

      (prisma.contentSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

      const result = await titleService.getContentSettings(mockOrgId);

      expect(prisma.contentSettings.findUnique).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
      });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('getCalendarEvents', () => {
    it('should return titles for a valid month', async () => {
      const mockTitles = [
        {
          id: 'title-1',
          organizationId: mockOrgId,
          title: 'Title 1',
          scheduledDate: new Date('2024-02-15'),
        },
      ];

      (prisma.blogTitle.findMany as jest.Mock).mockResolvedValue(mockTitles);

      const result = await titleService.getCalendarEvents('2024', '02', mockOrgId);

      expect(prisma.blogTitle.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          scheduledDate: {
            gte: new Date(2024, 1, 1),
            lte: new Date(2024, 1, 29, 23, 59, 59, 999),
          },
        },
        orderBy: { scheduledDate: 'asc' },
      });
      expect(result).toEqual(mockTitles);
    });

    it('should throw NotFoundError for invalid year', () => {
      expect(() =>
        titleService.getCalendarEvents('invalid', '02', mockOrgId)
      ).toThrow(NotFoundError);
      expect(() =>
        titleService.getCalendarEvents('invalid', '02', mockOrgId)
      ).toThrow('Invalid year or month');
    });

    it('should throw NotFoundError for invalid month', () => {
      expect(() =>
        titleService.getCalendarEvents('2024', '13', mockOrgId)
      ).toThrow(NotFoundError);
      expect(() => titleService.getCalendarEvents('2024', '0', mockOrgId)).toThrow(
        NotFoundError
      );
    });
  });
});
