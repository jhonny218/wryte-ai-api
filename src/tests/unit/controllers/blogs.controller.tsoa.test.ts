import { BlogsController } from '../../../controllers/blogs.controller.tsoa';
import { blogService } from '../../../services/blog.service';
import { userService } from '../../../services/user.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/blog.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/auth');

describe('BlogsController (TSOA)', () => {
  let controller: BlogsController;
  let mockRequest: Partial<ExpressRequest>;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  const mockBlog = {
    id: 'blog-123',
    blogOutlineId: 'outline-123',
    content: 'Test blog content',
    htmlContent: '<p>Test blog content</p>',
    wordCount: 100,
    status: 'DRAFT',
    publishedAt: null,
    exportedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new BlogsController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getBlogs', () => {
    it('should get all blogs for organization', async () => {
      const mockBlogs = [mockBlog];
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.getBlogs as jest.Mock).mockResolvedValue(mockBlogs);

      const result = await controller.getBlogs('org-123', mockRequest as ExpressRequest);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.getBlogs).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockBlogs);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getBlogs('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(blogService.getBlogs).not.toHaveBeenCalled();
    });

    it('should return empty array when no blogs found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.getBlogs as jest.Mock).mockResolvedValue([]);

      const result = await controller.getBlogs('org-123', mockRequest as ExpressRequest);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.getBlogs as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.getBlogs('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateBlog', () => {
    it('should update blog successfully', async () => {
      const updateBody = {
        content: 'Updated content',
        status: 'PUBLISHED' as const,
      };
      const updatedBlog = { ...mockBlog, ...updateBody };

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue(updatedBlog);

      const result = await controller.updateBlog(
        'org-123',
        'blog-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        content: 'Updated content',
        status: 'PUBLISHED',
      });
      expect(result).toEqual(updatedBlog);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.updateBlog(
          'org-123',
          'blog-123',
          { content: 'New content' },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(UnauthorizedError);

      expect(blogService.updateBlog).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        controller.updateBlog(
          'org-123',
          'blog-123',
          { status: 'INVALID_STATUS' as any },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow(BadRequestError);

      expect(blogService.updateBlog).not.toHaveBeenCalled();
    });

    it('should update with content only', async () => {
      const updateBody = { content: 'New content only' };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue({
        ...mockBlog,
        content: 'New content only',
      });

      await controller.updateBlog(
        'org-123',
        'blog-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        content: 'New content only',
      });
    });

    it('should update with htmlContent', async () => {
      const updateBody = { htmlContent: '<h1>New HTML</h1>' };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue({
        ...mockBlog,
        htmlContent: '<h1>New HTML</h1>',
      });

      await controller.updateBlog(
        'org-123',
        'blog-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        htmlContent: '<h1>New HTML</h1>',
      });
    });

    it('should update with wordCount', async () => {
      const updateBody = { wordCount: 500 };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue({
        ...mockBlog,
        wordCount: 500,
      });

      await controller.updateBlog(
        'org-123',
        'blog-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        wordCount: 500,
      });
    });

    it('should convert wordCount to number', async () => {
      const updateBody = { wordCount: '250' as any };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue({
        ...mockBlog,
        wordCount: 250,
      });

      await controller.updateBlog(
        'org-123',
        'blog-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        wordCount: 250,
      });
    });

    it('should allow DRAFT status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue(mockBlog);

      await controller.updateBlog(
        'org-123',
        'blog-123',
        { status: 'DRAFT' },
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        status: 'DRAFT',
      });
    });

    it('should allow PUBLISHED status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue({
        ...mockBlog,
        status: 'PUBLISHED',
      });

      await controller.updateBlog(
        'org-123',
        'blog-123',
        { status: 'PUBLISHED' },
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        status: 'PUBLISHED',
      });
    });

    it('should allow ARCHIVED status', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue({
        ...mockBlog,
        status: 'ARCHIVED',
      });

      await controller.updateBlog(
        'org-123',
        'blog-123',
        { status: 'ARCHIVED' },
        mockRequest as ExpressRequest
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith('org-123', 'blog-123', {
        status: 'ARCHIVED',
      });
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to update blog');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.updateBlog(
          'org-123',
          'blog-123',
          { content: 'New content' },
          mockRequest as ExpressRequest
        )
      ).rejects.toThrow('Failed to update blog');
    });
  });

  describe('deleteBlog', () => {
    it('should delete blog successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.deleteBlog as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.deleteBlog(
        'org-123',
        'blog-123',
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.deleteBlog).toHaveBeenCalledWith('org-123', 'blog-123');
      expect(result).toEqual({ message: 'Blog deleted successfully' });
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.deleteBlog('org-123', 'blog-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(blogService.deleteBlog).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to delete blog');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.deleteBlog as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.deleteBlog('org-123', 'blog-123', mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to delete blog');
    });
  });
});
