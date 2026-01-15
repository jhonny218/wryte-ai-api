import { BlogService } from '../../../services/blog.service';
import { prisma } from '../../../utils/prisma';
import { NotFoundError, ForbiddenError } from '../../../utils/errors';
import { BlogStatus } from '../../../../generated/prisma/client';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    fullBlog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('BlogService', () => {
  let blogService: BlogService;
  const mockOrgId = 'org-123';
  const mockBlogId = 'blog-123';
  const mockOutlineId = 'outline-123';
  const mockTitleId = 'title-123';

  beforeEach(() => {
    blogService = new BlogService();
    jest.clearAllMocks();
  });

  describe('getBlogs', () => {
    it('should return all blogs for an organization', async () => {
      const mockBlogs = [
        {
          id: mockBlogId,
          blogOutlineId: mockOutlineId,
          content: 'Blog content',
          htmlContent: '<p>Blog content</p>',
          wordCount: 100,
          status: BlogStatus.DRAFT,
          outline: {
            id: mockOutlineId,
            blogTitle: {
              id: mockTitleId,
              organizationId: mockOrgId,
              title: 'Test Title',
            },
          },
        },
      ];

      (prisma.fullBlog.findMany as jest.Mock).mockResolvedValue(mockBlogs);

      const result = await blogService.getBlogs(mockOrgId);

      expect(prisma.fullBlog.findMany).toHaveBeenCalledWith({
        where: {
          outline: {
            blogTitle: {
              organizationId: mockOrgId,
            },
          },
        },
        include: {
          outline: {
            include: {
              blogTitle: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockBlogs);
    });
  });

  describe('createBlog', () => {
    it('should create a blog successfully', async () => {
      const blogData = {
        content: 'Test blog content',
        htmlContent: '<p>Test blog content</p>',
        wordCount: 150,
      };

      const mockBlog = {
        id: mockBlogId,
        blogOutlineId: mockOutlineId,
        ...blogData,
        status: BlogStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.fullBlog.create as jest.Mock).mockResolvedValue(mockBlog);

      const result = await blogService.createBlog(mockOutlineId, blogData);

      expect(prisma.fullBlog.create).toHaveBeenCalledWith({
        data: {
          blogOutlineId: mockOutlineId,
          content: blogData.content,
          htmlContent: blogData.htmlContent,
          wordCount: blogData.wordCount,
          status: BlogStatus.DRAFT,
        },
      });
      expect(result).toEqual(mockBlog);
    });
  });

  describe('getBlogByOutlineId', () => {
    it('should return blog when found by outline ID', async () => {
      const mockBlog = {
        id: mockBlogId,
        blogOutlineId: mockOutlineId,
        content: 'Blog content',
        outline: {
          id: mockOutlineId,
          blogTitle: {
            id: mockTitleId,
            title: 'Test Title',
          },
        },
      };

      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(mockBlog);

      const result = await blogService.getBlogByOutlineId(mockOutlineId);

      expect(prisma.fullBlog.findUnique).toHaveBeenCalledWith({
        where: { blogOutlineId: mockOutlineId },
        include: {
          outline: {
            include: {
              blogTitle: true,
            },
          },
        },
      });
      expect(result).toEqual(mockBlog);
    });

    it('should return null when blog not found', async () => {
      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await blogService.getBlogByOutlineId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateBlog', () => {
    const mockBlog = {
      id: mockBlogId,
      blogOutlineId: mockOutlineId,
      content: 'Original content',
      status: BlogStatus.DRAFT,
      outline: {
        id: mockOutlineId,
        blogTitle: {
          id: mockTitleId,
          organizationId: mockOrgId,
        },
      },
    };

    it('should update blog successfully', async () => {
      const updateData = {
        content: 'Updated content',
        htmlContent: '<p>Updated content</p>',
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
      };

      const updatedBlog = { ...mockBlog, ...updateData };

      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.fullBlog.update as jest.Mock).mockResolvedValue(updatedBlog);

      const result = await blogService.updateBlog(mockOrgId, mockBlogId, updateData);

      expect(prisma.fullBlog.update).toHaveBeenCalledWith({
        where: { id: mockBlogId },
        data: updateData,
      });
      expect(result).toEqual(updatedBlog);
    });

    it('should update only provided fields', async () => {
      const updateData = { status: BlogStatus.PUBLISHED };

      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.fullBlog.update as jest.Mock).mockResolvedValue({
        ...mockBlog,
        ...updateData,
      });

      await blogService.updateBlog(mockOrgId, mockBlogId, updateData);

      expect(prisma.fullBlog.update).toHaveBeenCalledWith({
        where: { id: mockBlogId },
        data: updateData,
      });
    });

    it('should throw NotFoundError when blog does not exist', async () => {
      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        blogService.updateBlog(mockOrgId, mockBlogId, { status: BlogStatus.PUBLISHED })
      ).rejects.toThrow(NotFoundError);
      await expect(
        blogService.updateBlog(mockOrgId, mockBlogId, { status: BlogStatus.PUBLISHED })
      ).rejects.toThrow('Blog not found');
      expect(prisma.fullBlog.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when organization does not match', async () => {
      const blogFromDifferentOrg = {
        ...mockBlog,
        outline: {
          ...mockBlog.outline,
          blogTitle: {
            ...mockBlog.outline.blogTitle,
            organizationId: 'different-org',
          },
        },
      };

      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(blogFromDifferentOrg);

      await expect(
        blogService.updateBlog(mockOrgId, mockBlogId, { status: BlogStatus.PUBLISHED })
      ).rejects.toThrow(ForbiddenError);
      await expect(
        blogService.updateBlog(mockOrgId, mockBlogId, { status: BlogStatus.PUBLISHED })
      ).rejects.toThrow('You do not have permission to update this outline');
      expect(prisma.fullBlog.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteBlog', () => {
    const mockBlog = {
      id: mockBlogId,
      blogOutlineId: mockOutlineId,
      outline: {
        id: mockOutlineId,
        blogTitle: {
          id: mockTitleId,
          organizationId: mockOrgId,
        },
      },
    };

    it('should delete blog successfully', async () => {
      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(mockBlog);
      (prisma.fullBlog.delete as jest.Mock).mockResolvedValue(mockBlog);

      await blogService.deleteBlog(mockOrgId, mockBlogId);

      expect(prisma.fullBlog.delete).toHaveBeenCalledWith({
        where: { id: mockBlogId },
      });
    });

    it('should throw NotFoundError when blog does not exist', async () => {
      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(blogService.deleteBlog(mockOrgId, mockBlogId)).rejects.toThrow(
        NotFoundError
      );
      expect(prisma.fullBlog.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when organization does not match', async () => {
      const blogFromDifferentOrg = {
        ...mockBlog,
        outline: {
          ...mockBlog.outline,
          blogTitle: {
            ...mockBlog.outline.blogTitle,
            organizationId: 'different-org',
          },
        },
      };

      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(blogFromDifferentOrg);

      await expect(blogService.deleteBlog(mockOrgId, mockBlogId)).rejects.toThrow(
        ForbiddenError
      );
      expect(prisma.fullBlog.delete).not.toHaveBeenCalled();
    });
  });

  describe('getBlog', () => {
    it('should return blog when found', async () => {
      const mockBlog = {
        id: mockBlogId,
        blogOutlineId: mockOutlineId,
        content: 'Blog content',
        outline: {
          id: mockOutlineId,
          blogTitle: {
            id: mockTitleId,
            title: 'Test Title',
          },
        },
      };

      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(mockBlog);

      const result = await blogService.getBlog(mockBlogId);

      expect(prisma.fullBlog.findUnique).toHaveBeenCalledWith({
        where: { id: mockBlogId },
        include: {
          outline: {
            include: {
              blogTitle: true,
            },
          },
        },
      });
      expect(result).toEqual(mockBlog);
    });

    it('should throw NotFoundError when blog not found', async () => {
      (prisma.fullBlog.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(blogService.getBlog('non-existent')).rejects.toThrow(NotFoundError);
      await expect(blogService.getBlog('non-existent')).rejects.toThrow('Blog not found');
    });
  });
});
