import { Request, Response, NextFunction } from 'express';
import { userController } from '../../../controllers/user.controller';
import { userService } from '../../../services/user.service';
import { successResponse, createdResponse } from '../../../utils/response';
import { getAuth, clerkClient } from '@clerk/express';
import { NotFoundError } from '../../../utils/errors';

jest.mock('../../../services/user.service');
jest.mock('../../../utils/response');
jest.mock('@clerk/express', () => ({
  getAuth: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
}));

describe('UserController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'John Doe',
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

  describe('create', () => {
    it('should create user successfully', async () => {
      const mockCreatedUser = {
        ...mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (clerkClient.users.getUser as jest.Mock).mockResolvedValue(mockClerkUser);
      (userService.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      await userController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(clerkClient.users.getUser).toHaveBeenCalledWith('clerk-123');
      expect(userService.create).toHaveBeenCalledWith({
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'John Doe',
      });
      expect(createdResponse).toHaveBeenCalledWith(
        mockRes,
        mockCreatedUser,
        'User created successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should create user with partial name', async () => {
      const mockClerkUserPartialName = {
        id: 'clerk-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: null,
      };

      (clerkClient.users.getUser as jest.Mock).mockResolvedValue(mockClerkUserPartialName);
      (userService.create as jest.Mock).mockResolvedValue(mockUser);

      await userController.create(
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

    it('should create user with null name when firstName and lastName are empty', async () => {
      const mockClerkUserNoName = {
        id: 'clerk-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: null,
        lastName: null,
      };

      (clerkClient.users.getUser as jest.Mock).mockResolvedValue(mockClerkUserNoName);
      (userService.create as jest.Mock).mockResolvedValue(mockUser);

      await userController.create(
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

    it('should throw NotFoundError when user not authenticated', async () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await userController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(clerkClient.users.getUser).not.toHaveBeenCalled();
      expect(userService.create).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(createdResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Clerk API error');

      (clerkClient.users.getUser as jest.Mock).mockRejectedValue(error);

      await userController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(createdResponse).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get user by id successfully', async () => {
      mockReq.params = { id: 'user-123' };

      (userService.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findById).toHaveBeenCalledWith('user-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not found', async () => {
      mockReq.params = { id: 'user-123' };

      (userService.findById as jest.Mock).mockResolvedValue(null);

      await userController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findById).toHaveBeenCalledWith('user-123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');
      mockReq.params = { id: 'user-123' };

      (userService.findById as jest.Mock).mockRejectedValue(error);

      await userController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('getByClerkId', () => {
    it('should get user by clerk id successfully', async () => {
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);

      await userController.getByClerkId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not authenticated', async () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await userController.getByClerkId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not found', async () => {
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await userController.getByClerkId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');

      (userService.findByClerkId as jest.Mock).mockRejectedValue(error);

      await userController.getByClerkId(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const updatedClerkUser = {
        id: 'clerk-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const updatedUser = {
        ...mockUser,
        name: 'Jane Smith',
      };

      mockReq.body = updateData;

      (clerkClient.users.updateUser as jest.Mock).mockResolvedValue(updatedClerkUser);
      (userService.update as jest.Mock).mockResolvedValue(updatedUser);

      await userController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(clerkClient.users.updateUser).toHaveBeenCalledWith('clerk-123', {
        firstName: 'Jane',
        lastName: 'Smith',
      });
      expect(userService.update).toHaveBeenCalledWith('clerk-123', {
        email: 'test@example.com',
        name: 'Jane Smith',
      });
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        updatedUser,
        'User updated successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update user with partial name', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: null,
      };
      const updatedClerkUser = {
        id: 'clerk-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Jane',
        lastName: null,
      };

      mockReq.body = updateData;

      (clerkClient.users.updateUser as jest.Mock).mockResolvedValue(updatedClerkUser);
      (userService.update as jest.Mock).mockResolvedValue(mockUser);

      await userController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.update).toHaveBeenCalledWith('clerk-123', {
        email: 'test@example.com',
        name: 'Jane',
      });
    });

    it('should throw NotFoundError when user not authenticated', async () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await userController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(clerkClient.users.updateUser).not.toHaveBeenCalled();
      expect(userService.update).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Clerk API error');
      mockReq.body = { firstName: 'Jane', lastName: 'Smith' };

      (clerkClient.users.updateUser as jest.Mock).mockRejectedValue(error);

      await userController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      (clerkClient.users.deleteUser as jest.Mock).mockResolvedValue(undefined);
      (userService.delete as jest.Mock).mockResolvedValue(undefined);

      await userController.delete(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(clerkClient.users.deleteUser).toHaveBeenCalledWith('clerk-123');
      expect(userService.delete).toHaveBeenCalledWith('clerk-123');
      expect(successResponse).toHaveBeenCalledWith(
        mockRes,
        null,
        'User deleted successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not authenticated', async () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await userController.delete(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(clerkClient.users.deleteUser).not.toHaveBeenCalled();
      expect(userService.delete).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors from Clerk and call next', async () => {
      const error = new Error('Clerk API error');

      (clerkClient.users.deleteUser as jest.Mock).mockRejectedValue(error);

      await userController.delete(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(userService.delete).not.toHaveBeenCalled();
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors from service and call next', async () => {
      const error = new Error('Database error');

      (clerkClient.users.deleteUser as jest.Mock).mockResolvedValue(undefined);
      (userService.delete as jest.Mock).mockRejectedValue(error);

      await userController.delete(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });

  describe('getUserOrganizations', () => {
    it('should get user organizations successfully', async () => {
      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Organization 1',
          slug: 'org-1',
        },
        {
          id: 'org-2',
          name: 'Organization 2',
          slug: 'org-2',
        },
      ];

      (userService.getUserOrganizations as jest.Mock).mockResolvedValue(mockOrganizations);

      await userController.getUserOrganizations(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(getAuth).toHaveBeenCalledWith(mockReq);
      expect(userService.getUserOrganizations).toHaveBeenCalledWith('clerk-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, mockOrganizations);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no organizations', async () => {
      (userService.getUserOrganizations as jest.Mock).mockResolvedValue([]);

      await userController.getUserOrganizations(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.getUserOrganizations).toHaveBeenCalledWith('clerk-123');
      expect(successResponse).toHaveBeenCalledWith(mockRes, []);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not authenticated', async () => {
      (getAuth as jest.Mock).mockReturnValue({ userId: null });

      await userController.getUserOrganizations(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(userService.getUserOrganizations).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(successResponse).not.toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      const error = new Error('Database error');

      (userService.getUserOrganizations as jest.Mock).mockRejectedValue(error);

      await userController.getUserOrganizations(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(successResponse).not.toHaveBeenCalled();
    });
  });
});
