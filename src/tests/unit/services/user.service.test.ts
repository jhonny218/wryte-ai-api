import { userService } from '../../../services/user.service';
import { prisma } from '../../../utils/prisma';
import { ConflictError } from '../../../utils/errors';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('UserService', () => {
  const mockUser = {
    id: 'user-123',
    clerkId: 'clerk-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userData = {
      clerkId: 'clerk-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should create a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.create(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: userData.clerkId,
          email: userData.email,
          name: userData.name,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create a user with null name if name is not provided', async () => {
      const userDataWithoutName = {
        clerkId: 'clerk-123',
        email: 'test@example.com',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser, name: null });

      await userService.create(userDataWithoutName);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: userDataWithoutName.clerkId,
          email: userDataWithoutName.email,
          name: null,
        },
      });
    });

    it('should throw ConflictError when user with email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(userService.create(userData)).rejects.toThrow(ConflictError);
      await expect(userService.create(userData)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findById('user-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByClerkId', () => {
    it('should return user when found by clerkId', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByClerkId('clerk-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by clerkId', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.findByClerkId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateData = {
      email: 'updated@example.com',
      name: 'Updated Name',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.update('clerk-123', updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' },
        data: {
          email: updateData.email,
          name: updateData.name,
        },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.delete('clerk-123');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserOrganizations', () => {
    it('should return user organizations with hasOrganizations true', async () => {
      const mockUserWithOrgs = {
        ...mockUser,
        organizationMemberships: [
          {
            id: 'membership-1',
            role: 'OWNER',
            createdAt: new Date('2024-01-01'),
            organization: {
              id: 'org-1',
              name: 'Org 1',
              slug: 'org-1',
            },
          },
          {
            id: 'membership-2',
            role: 'MEMBER',
            createdAt: new Date('2024-01-02'),
            organization: {
              id: 'org-2',
              name: 'Org 2',
              slug: 'org-2',
            },
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithOrgs);

      const result = await userService.getUserOrganizations('clerk-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      expect(result).toEqual({
        hasOrganizations: true,
        organizations: [
          { ...mockUserWithOrgs.organizationMemberships[0]!.organization, role: 'OWNER' },
          { ...mockUserWithOrgs.organizationMemberships[1]!.organization, role: 'MEMBER' },
        ],
        primaryOrganization: mockUserWithOrgs.organizationMemberships[0]!.organization,
      });
    });

    it('should return hasOrganizations false when user has no organizations', async () => {
      const mockUserNoOrgs = {
        ...mockUser,
        organizationMemberships: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserNoOrgs);

      const result = await userService.getUserOrganizations('clerk-123');

      expect(result).toEqual({
        hasOrganizations: false,
        organizations: [],
        primaryOrganization: null,
      });
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.getUserOrganizations('non-existent');

      expect(result).toBeNull();
    });
  });
});
