import { OrganizationsController } from '../../../controllers/organizations.controller.tsoa';
import { organizationService } from '../../../services/organization.service';
import { userService } from '../../../services/user.service';
import { getUserId } from '../../../utils/auth';
import { UnauthorizedError, NotFoundError } from '../../../utils/errors';
import type { Request as ExpressRequest } from 'express';

jest.mock('../../../services/organization.service');
jest.mock('../../../services/user.service');
jest.mock('../../../utils/auth');

describe('OrganizationsController (TSOA)', () => {
  let controller: OrganizationsController;
  let mockRequest: Partial<ExpressRequest>;

  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
  };

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    mission: 'Test mission',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    controller = new OrganizationsController();
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getOrganizations', () => {
    it('should get all organizations for user', async () => {
      const mockOrganizations = [mockOrganization];
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findAll as jest.Mock).mockResolvedValue(mockOrganizations);

      const result = await controller.getOrganizations(mockRequest as ExpressRequest);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findAll).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrganizations);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getOrganizations(mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(organizationService.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no organizations', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findAll as jest.Mock).mockResolvedValue([]);

      const result = await controller.getOrganizations(mockRequest as ExpressRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('createOrganization', () => {
    const requestBody = {
      name: 'New Organization',
      slug: 'new-org',
      mission: 'New mission',
    };

    it('should create organization successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockResolvedValue(mockOrganization);

      const result = await controller.createOrganization(
        requestBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.create).toHaveBeenCalledWith('user-123', requestBody);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Organization created successfully');
      expect(result.data).toEqual(mockOrganization);
    });

    it('should throw UnauthorizedError when clerkId is missing', async () => {
      (getUserId as jest.Mock).mockReturnValue(null);

      await expect(
        controller.createOrganization(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(organizationService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user not found in test env', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.createOrganization(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(NotFoundError);

      expect(organizationService.create).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to create organization');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.create as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.createOrganization(requestBody, mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to create organization');
    });
  });

  describe('getOrganizationById', () => {
    it('should get organization by ID successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findById as jest.Mock).mockResolvedValue(mockOrganization);

      const result = await controller.getOrganizationById(
        'org-123',
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findById).toHaveBeenCalledWith('user-123', 'org-123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrganization);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getOrganizationById('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(organizationService.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when organization not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getOrganizationById('org-123', mockRequest as ExpressRequest)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getOrganizationBySlug', () => {
    it('should get organization by slug successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findBySlug as jest.Mock).mockResolvedValue(mockOrganization);

      const result = await controller.getOrganizationBySlug(
        'test-org',
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.findBySlug).toHaveBeenCalledWith('user-123', 'test-org');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrganization);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getOrganizationBySlug('test-org', mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(organizationService.findBySlug).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when organization not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.findBySlug as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getOrganizationBySlug('test-org', mockRequest as ExpressRequest)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateOrganization', () => {
    const updateBody = {
      name: 'Updated Organization',
      mission: 'Updated mission',
    };

    const updatedOrg = {
      ...mockOrganization,
      ...updateBody,
    };

    it('should update organization successfully', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.update as jest.Mock).mockResolvedValue(updatedOrg);

      const result = await controller.updateOrganization(
        'org-123',
        updateBody,
        mockRequest as ExpressRequest
      );

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(userService.findByClerkId).toHaveBeenCalledWith('clerk-123');
      expect(organizationService.update).toHaveBeenCalledWith('user-123', 'org-123', updateBody);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Organization updated successfully');
      expect(result.data).toEqual(updatedOrg);
    });

    it('should throw UnauthorizedError when user not found', async () => {
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.updateOrganization('org-123', updateBody, mockRequest as ExpressRequest)
      ).rejects.toThrow(UnauthorizedError);

      expect(organizationService.update).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to update organization');
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.update as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.updateOrganization('org-123', updateBody, mockRequest as ExpressRequest)
      ).rejects.toThrow('Failed to update organization');
    });

    it('should update with partial data', async () => {
      const partialUpdate = { name: 'Only Name Updated' };
      (getUserId as jest.Mock).mockReturnValue('clerk-123');
      (userService.findByClerkId as jest.Mock).mockResolvedValue(mockUser);
      (organizationService.update as jest.Mock).mockResolvedValue({
        ...mockOrganization,
        name: 'Only Name Updated',
      });

      const result = await controller.updateOrganization(
        'org-123',
        partialUpdate,
        mockRequest as ExpressRequest
      );

      expect(organizationService.update).toHaveBeenCalledWith('user-123', 'org-123', partialUpdate);
      expect(result.success).toBe(true);
    });
  });
});
