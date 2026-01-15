import { Request, Response, NextFunction } from 'express';
import { blogController } from '../../../controllers/blog.controller';
import { blogService } from '../../../services/blog.service';
import { userService } from '../../../services/user.service';
import { successResponse } from '../../../utils/response';
import { getAuth } from '@clerk/express';
import { UnauthorizedError } from '../../../utils/errors';

jest.mock('../../../services/blog.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/response');
jest.mock('@clerk/express');

describe('BlogController', () => {
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

  describe('getBlogs', () => {
    it('should get blogs successfully', async () => {
      const orgId = 'org-123';
      const mockBlogs = [
        {
          id: 'blog-1',
          content: 'Blog content 1',
          htmlContent: '<p>Blog content 1</p>',
          organizationId: orgId,
          status: 'DRAFT',
        },
        {
          id: 'blog-2',
          content: 'Blog content 2',
          htmlContent: '<p>Blog content 2</p>',
          organizationId: orgId,
          status: 'PUBLISHED',
        },
      ];

      mockReq.params = { orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.getBlogs as jest.Mock).mockResolvedValue(mockBlogs);

      await blogController.getBlogs(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.getBlogs).toHaveBeenCalledWith(orgId);
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockBlogs);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      mockReq.params = { orgId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await blogController.getBlogs(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.getBlogs).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.getBlogs as jest.Mock).mockRejectedValue(error);

      await blogController.getBlogs(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('updateBlog', () => {
    it('should update blog successfully', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';
      const updateData = {
        content: 'Updated content',
        htmlContent: '<p>Updated content</p>',
        wordCount: 500,
        status: 'PUBLISHED',
      };
      const mockUpdatedBlog = {
        id: blogId,
        ...updateData,
        organizationId: orgId,
      };

      mockReq.params = { orgId, blogId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue(mockUpdatedBlog);

      await blogController.updateBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.updateBlog).toHaveBeenCalledWith(orgId, blogId, updateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedBlog,
        'Blog updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update blog with partial data', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';
      const updateData = {
        content: 'Updated content only',
      };
      const mockUpdatedBlog = {
        id: blogId,
        content: 'Updated content only',
        htmlContent: '<p>Original HTML</p>',
        organizationId: orgId,
        status: 'DRAFT',
      };

      mockReq.params = { orgId, blogId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue(mockUpdatedBlog);

      await blogController.updateBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith(
        orgId,
        blogId,
        { content: 'Updated content only' }
      );
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedBlog,
        'Blog updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update blog with all fields', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';
      const updateData = {
        content: 'New content',
        htmlContent: '<p>New HTML content</p>',
        wordCount: 750,
        status: 'ARCHIVED',
      };
      const mockUpdatedBlog = {
        id: blogId,
        ...updateData,
        organizationId: orgId,
      };

      mockReq.params = { orgId, blogId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockResolvedValue(mockUpdatedBlog);

      await blogController.updateBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(blogService.updateBlog).toHaveBeenCalledWith(orgId, blogId, updateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedBlog,
        'Blog updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for invalid status', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';
      const updateData = {
        content: 'Updated content',
        status: 'INVALID_STATUS',
      };

      mockReq.params = { orgId, blogId };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await blogController.updateBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(blogService.updateBlog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';
      mockReq.params = { orgId, blogId };
      mockReq.body = { content: 'Updated content' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await blogController.updateBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.updateBlog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123', blogId: 'blog-123' };
      mockReq.body = { content: 'Updated content' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.updateBlog as jest.Mock).mockRejectedValue(error);

      await blogController.updateBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('deleteBlog', () => {
    it('should delete blog successfully', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';

      mockReq.params = { orgId, blogId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.deleteBlog as jest.Mock).mockResolvedValue(undefined);

      await blogController.deleteBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.deleteBlog).toHaveBeenCalledWith(orgId, blogId);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        'Blog deleted successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      const orgId = 'org-123';
      const blogId = 'blog-123';
      mockReq.params = { orgId, blogId };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await blogController.deleteBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(blogService.deleteBlog).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123', blogId: 'blog-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (blogService.deleteBlog as jest.Mock).mockRejectedValue(error);

      await blogController.deleteBlog(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
