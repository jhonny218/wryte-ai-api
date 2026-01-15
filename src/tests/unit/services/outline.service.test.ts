import { OutlineService } from '../../../services/outline.service';
import { prisma } from '../../../utils/prisma';
import { NotFoundError, ForbiddenError } from '../../../utils/errors';
import { OutlineStatus } from '../../../../generated/prisma/client';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    blogOutline: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('OutlineService', () => {
  let outlineService: OutlineService;
  const mockOrgId = 'org-123';
  const mockOutlineId = 'outline-123';
  const mockTitleId = 'title-123';

  beforeEach(() => {
    outlineService = new OutlineService();
    jest.clearAllMocks();
  });

  describe('getOutlines', () => {
    it('should return all outlines for an organization', async () => {
      const mockOutlines = [
        {
          id: mockOutlineId,
          blogTitleId: mockTitleId,
          structure: { sections: [] },
          seoKeywords: ['keyword1'],
          metaDescription: 'Test description',
          status: OutlineStatus.PENDING,
          blogTitle: {
            id: mockTitleId,
            organizationId: mockOrgId,
            title: 'Test Title',
          },
        },
      ];

      (prisma.blogOutline.findMany as jest.Mock).mockResolvedValue(mockOutlines);

      const result = await outlineService.getOutlines(mockOrgId);

      expect(prisma.blogOutline.findMany).toHaveBeenCalledWith({
        where: {
          blogTitle: {
            organizationId: mockOrgId,
          },
        },
        include: {
          blogTitle: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockOutlines);
    });
  });

  describe('createOutline', () => {
    it('should create an outline with all fields', async () => {
      const outlineData = {
        structure: { introduction: {}, sections: [], conclusion: {} },
        seoKeywords: ['keyword1', 'keyword2'],
        metaDescription: 'Test meta description',
        suggestedImages: ['image1.jpg', 'image2.jpg'],
      };

      const mockOutline = {
        id: mockOutlineId,
        blogTitleId: mockTitleId,
        ...outlineData,
        status: OutlineStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.blogOutline.create as jest.Mock).mockResolvedValue(mockOutline);

      const result = await outlineService.createOutline(mockTitleId, outlineData);

      expect(prisma.blogOutline.create).toHaveBeenCalledWith({
        data: {
          blogTitleId: mockTitleId,
          structure: outlineData.structure,
          seoKeywords: outlineData.seoKeywords,
          metaDescription: outlineData.metaDescription,
          suggestedImages: outlineData.suggestedImages,
          status: OutlineStatus.PENDING,
        },
      });
      expect(result).toEqual(mockOutline);
    });

    it('should create an outline without suggestedImages', async () => {
      const outlineData = {
        structure: { introduction: {}, sections: [] },
        seoKeywords: ['keyword1'],
        metaDescription: 'Test description',
      };

      const mockOutline = {
        id: mockOutlineId,
        blogTitleId: mockTitleId,
        ...outlineData,
        suggestedImages: [],
        status: OutlineStatus.PENDING,
      };

      (prisma.blogOutline.create as jest.Mock).mockResolvedValue(mockOutline);

      await outlineService.createOutline(mockTitleId, outlineData);

      expect(prisma.blogOutline.create).toHaveBeenCalledWith({
        data: {
          blogTitleId: mockTitleId,
          structure: outlineData.structure,
          seoKeywords: outlineData.seoKeywords,
          metaDescription: outlineData.metaDescription,
          suggestedImages: [],
          status: OutlineStatus.PENDING,
        },
      });
    });
  });

  describe('getOutlineByTitleId', () => {
    it('should return outline when found by title ID', async () => {
      const mockOutline = {
        id: mockOutlineId,
        blogTitleId: mockTitleId,
        structure: {},
        blogTitle: {
          id: mockTitleId,
          title: 'Test Title',
        },
      };

      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(mockOutline);

      const result = await outlineService.getOutlineByTitleId(mockTitleId);

      expect(prisma.blogOutline.findUnique).toHaveBeenCalledWith({
        where: { blogTitleId: mockTitleId },
        include: { blogTitle: true },
      });
      expect(result).toEqual(mockOutline);
    });

    it('should return null when outline not found', async () => {
      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await outlineService.getOutlineByTitleId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateOutline', () => {
    const mockOutline = {
      id: mockOutlineId,
      blogTitleId: mockTitleId,
      structure: { sections: [] },
      seoKeywords: ['keyword1'],
      status: OutlineStatus.PENDING,
      blogTitle: {
        id: mockTitleId,
        organizationId: mockOrgId,
      },
    };

    it('should update outline successfully', async () => {
      const updateData = {
        structure: { sections: [{ heading: 'New Section' }] },
        seoKeywords: ['keyword1', 'keyword2'],
        metaDescription: 'Updated description',
        status: OutlineStatus.APPROVED,
      };

      const updatedOutline = { ...mockOutline, ...updateData };

      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(mockOutline);
      (prisma.blogOutline.update as jest.Mock).mockResolvedValue(updatedOutline);

      const result = await outlineService.updateOutline(
        mockOrgId,
        mockOutlineId,
        updateData
      );

      expect(prisma.blogOutline.update).toHaveBeenCalledWith({
        where: { id: mockOutlineId },
        data: updateData,
      });
      expect(result).toEqual(updatedOutline);
    });

    it('should update only provided fields', async () => {
      const updateData = { status: OutlineStatus.APPROVED };

      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(mockOutline);
      (prisma.blogOutline.update as jest.Mock).mockResolvedValue({
        ...mockOutline,
        ...updateData,
      });

      await outlineService.updateOutline(mockOrgId, mockOutlineId, updateData);

      expect(prisma.blogOutline.update).toHaveBeenCalledWith({
        where: { id: mockOutlineId },
        data: updateData,
      });
    });

    it('should throw NotFoundError when outline does not exist', async () => {
      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        outlineService.updateOutline(mockOrgId, mockOutlineId, { status: OutlineStatus.APPROVED })
      ).rejects.toThrow(NotFoundError);
      await expect(
        outlineService.updateOutline(mockOrgId, mockOutlineId, { status: OutlineStatus.APPROVED })
      ).rejects.toThrow('Outline not found');
      expect(prisma.blogOutline.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when organization does not match', async () => {
      const outlineFromDifferentOrg = {
        ...mockOutline,
        blogTitle: {
          ...mockOutline.blogTitle,
          organizationId: 'different-org',
        },
      };

      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(outlineFromDifferentOrg);

      await expect(
        outlineService.updateOutline(mockOrgId, mockOutlineId, { status: OutlineStatus.APPROVED })
      ).rejects.toThrow(ForbiddenError);
      await expect(
        outlineService.updateOutline(mockOrgId, mockOutlineId, { status: OutlineStatus.APPROVED })
      ).rejects.toThrow('You do not have permission to update this outline');
      expect(prisma.blogOutline.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteOutline', () => {
    const mockOutline = {
      id: mockOutlineId,
      blogTitleId: mockTitleId,
      blogTitle: {
        id: mockTitleId,
        organizationId: mockOrgId,
      },
    };

    it('should delete outline successfully', async () => {
      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(mockOutline);
      (prisma.blogOutline.delete as jest.Mock).mockResolvedValue(mockOutline);

      await outlineService.deleteOutline(mockOrgId, mockOutlineId);

      expect(prisma.blogOutline.delete).toHaveBeenCalledWith({
        where: { id: mockOutlineId },
      });
    });

    it('should throw NotFoundError when outline does not exist', async () => {
      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(outlineService.deleteOutline(mockOrgId, mockOutlineId)).rejects.toThrow(
        NotFoundError
      );
      expect(prisma.blogOutline.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when organization does not match', async () => {
      const outlineFromDifferentOrg = {
        ...mockOutline,
        blogTitle: {
          ...mockOutline.blogTitle,
          organizationId: 'different-org',
        },
      };

      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(outlineFromDifferentOrg);

      await expect(outlineService.deleteOutline(mockOrgId, mockOutlineId)).rejects.toThrow(
        ForbiddenError
      );
      expect(prisma.blogOutline.delete).not.toHaveBeenCalled();
    });
  });

  describe('getOutline', () => {
    it('should return outline when found', async () => {
      const mockOutline = {
        id: mockOutlineId,
        blogTitleId: mockTitleId,
        structure: {},
        blogTitle: {
          id: mockTitleId,
          title: 'Test Title',
        },
      };

      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(mockOutline);

      const result = await outlineService.getOutline(mockOutlineId);

      expect(prisma.blogOutline.findUnique).toHaveBeenCalledWith({
        where: { id: mockOutlineId },
        include: { blogTitle: true },
      });
      expect(result).toEqual(mockOutline);
    });

    it('should throw NotFoundError when outline not found', async () => {
      (prisma.blogOutline.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(outlineService.getOutline('non-existent')).rejects.toThrow(NotFoundError);
      await expect(outlineService.getOutline('non-existent')).rejects.toThrow(
        'Outline not found'
      );
    });
  });
});
