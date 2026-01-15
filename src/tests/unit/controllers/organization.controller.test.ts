import { Request, Response, NextFunction } from 'express';
import { organizationController } from '../../../controllers/organization.controller';
import { organizationService } from '../../../services/organization.service';
import { userService } from '../../../services/user.service';
import { successResponse, createdResponse } from '../../../utils/response';
import { getAuth, clerkClient } from '@clerk/express';
import { NotFoundError, UnauthorizedError } from '../../../utils/errors';

jest.mock('../../../services/organization.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/response');
jest.mock('@clerk/express', () => ({
  getAuth: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

describe('OrganizationController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'John Doe',
  };

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClerkUser = {
    id: 'clerk-123',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'John',
    lastName: 'Doe',
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

  describe('getAll', () => {
    it('should get all organizations for user successfully', async () => {
      const mockOrganizations = [
        mockOrganization,
        {
          id: 'org-456',
          name: 'Another Organization',
          slug: 'another-organization',
        },
      ];

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findAll as jest.Mock).mockResolvedValue(mockOrganizations);

      await organizationController.getAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findAll).toHaveBeenCalledWith('user-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockOrganizations);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no organizations', async () => {
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findAll as jest.Mock).mockResolvedValue([]);

      await organizationController.getAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(organizationService.findAll).toHaveBeenCalledWith('user-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, []);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await organizationController.getAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findAll).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findAll as jest.Mock).mockRejectedValue(error);

      await organizationController.getAll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create organization successfully with existing user', async () => {
      const orgData = {
        name: 'New Organization',
        slug: 'new-organization',
      };

      mockReq.body = orgData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockResolvedValue(mockOrganization);

      await organizationController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.create).toHaveBeenCalledWith('user-123', orgData);
      expect(createdResponse).toHaveBeenCalledWith(
        mockRes,
        mockOrganization,
        'Organization created successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should auto-create user if not exists and then create organization', async () => {
      const orgData = {
        name: 'New Organization',
        slug: 'new-organization',
      };

      mockReq.body = orgData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);
      (clerkClient.users.getUser as jest.Mock).mockResolvedValue(mockClerkUser);
      (userService.create as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockResolvedValue(mockOrganization);

      await organizationController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(clerkClient.users.getUser).toHaveBeenCalledWith('clerk-123');
      expect(userService.create).toHaveBeenCalledWith({
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'John Doe',
      });
      expect(organizationService.create).toHaveBeenCalledWith('user-123', orgData);
      expect(createdResponse).toHaveBeenCalledWith(
        mockRes,
        mockOrganization,
        'Organization created successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should auto-create user with partial name', async () => {
      const orgData = {
        name: 'New Organization',
        slug: 'new-organization',
      };

      const mockClerkUserPartialName = {
        id: 'clerk-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: null,
      };

      mockReq.body = orgData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);
      (clerkClient.users.getUser as jest.Mock).mockResolvedValue(mockClerkUserPartialName);
      (userService.create as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockResolvedValue(mockOrganization);

      await organizationController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.create).toHaveBeenCalledWith({
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'John',
      });
    });

    it('should auto-create user with null name when firstName and lastName are empty', async () => {
      const orgData = {
        name: 'New Organization',
        slug: 'new-organization',
      };

      const mockClerkUserNoName = {
        id: 'clerk-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: null,
        lastName: null,
      };

      mockReq.body = orgData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);
      (clerkClient.users.getUser as jest.Mock).mockResolvedValue(mockClerkUserNoName);
      (userService.create as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockResolvedValue(mockOrganization);

      await organizationController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.create).toHaveBeenCalledWith({
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: null,
      });
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.body = { name: 'New Organization', slug: 'new-organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockRejectedValue(error);

      await organizationController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(createdResponse).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get organization by id successfully', async () => {
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findById as jest.Mock).mockResolvedValue(mockOrganization);

      await organizationController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findById).toHaveBeenCalledWith('user-123', 'org-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockOrganization);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await organizationController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findById).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when organization not found', async () => {
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findById as jest.Mock).mockResolvedValue(null);

      await organizationController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(organizationService.findById).toHaveBeenCalledWith('user-123', 'org-123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findById as jest.Mock).mockRejectedValue(error);

      await organizationController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('getBySlug', () => {
    it('should get organization by slug successfully', async () => {
      mockReq.params = { slug: 'test-organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findBySlug as jest.Mock).mockResolvedValue(mockOrganization);

      await organizationController.getBySlug(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findBySlug).toHaveBeenCalledWith('user-123', 'test-organization');
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockOrganization);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      mockReq.params = { slug: 'test-organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await organizationController.getBySlug(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findBySlug).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when organization not found', async () => {
      mockReq.params = { slug: 'test-organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findBySlug as jest.Mock).mockResolvedValue(null);

      await organizationController.getBySlug(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(organizationService.findBySlug).toHaveBeenCalledWith('user-123', 'test-organization');
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { slug: 'test-organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findBySlug as jest.Mock).mockRejectedValue(error);

      await organizationController.getBySlug(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update organization successfully', async () => {
      const updateData = {
        name: 'Updated Organization',
        slug: 'updated-organization',
      };
      const updatedOrganization = {
        ...mockOrganization,
        ...updateData,
      };

      mockReq.params = { orgId: 'org-123' };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.update as jest.Mock).mockResolvedValue(updatedOrganization);

      await organizationController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.update).toHaveBeenCalledWith('user-123', 'org-123', updateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        updatedOrganization,
        'Organization updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update organization with partial data', async () => {
      const updateData = {
        name: 'Updated Name Only',
      };
      const updatedOrganization = {
        ...mockOrganization,
        name: 'Updated Name Only',
      };

      mockReq.params = { orgId: 'org-123' };
      mockReq.body = updateData;

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.update as jest.Mock).mockResolvedValue(updatedOrganization);

      await organizationController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(organizationService.update).toHaveBeenCalledWith('user-123', 'org-123', updateData);
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        updatedOrganization,
        'Organization updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not found', async () => {
      mockReq.params = { orgId: 'org-123' };
      mockReq.body = { name: 'Updated Organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await organizationController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.update).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { orgId: 'org-123' };
      mockReq.body = { name: 'Updated Organization' };

      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.update as jest.Mock).mockRejectedValue(error);

      await organizationController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
