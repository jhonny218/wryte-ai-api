import { organizationService } from '../../../services/organization.service';
import { prisma } from '../../../utils/prisma';
import { ForbiddenError } from '../../../utils/errors';
import { uniqueSlug } from '../../../utils/slug';

jest.mock('../../../utils/prisma', () => ({
  prisma: {
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../utils/slug', () => ({
  uniqueSlug: jest.fn(),
}));

describe('OrganizationService', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockOrg = {
    id: mockOrgId,
    name: 'Test Org',
    slug: 'test-org',
    mission: 'Test mission',
    description: 'Test description',
    websiteUrl: 'https://test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all organizations for a user', async () => {
      const mockOrgs = [
        {
          ...mockOrg,
          members: [{ role: 'OWNER' }],
        },
      ];

      (prisma.organization.findMany as jest.Mock).mockResolvedValue(mockOrgs);

      const result = await organizationService.findAll(mockUserId);

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { members: { some: { userId: mockUserId } } },
        include: {
          members: {
            where: { userId: mockUserId },
            select: { role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockOrgs);
    });
  });

  describe('create', () => {
    const createData = {
      name: 'New Org',
      mission: 'New mission',
      description: 'New description',
      websiteUrl: 'https://neworg.com',
      contentSettings: {
        primaryKeywords: ['keyword1', 'keyword2'],
        secondaryKeywords: ['secondary1'],
        postingDaysOfWeek: ['Monday', 'Wednesday'],
        tone: 'professional',
        targetAudience: 'developers',
        industry: 'tech',
        goals: ['engagement', 'education'],
        competitorUrls: ['https://competitor.com'],
        topicsToAvoid: ['politics'],
        preferredLength: 'MEDIUM',
      },
    };

    it('should create organization with content settings', async () => {
      const mockSlug = 'new-org';
      const mockCreatedOrg = {
        ...mockOrg,
        name: createData.name,
        slug: mockSlug,
        contentSettings: createData.contentSettings,
        members: [{ role: 'OWNER' }],
      };

      (uniqueSlug as jest.Mock).mockResolvedValue(mockSlug);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          organization: {
            create: jest.fn().mockResolvedValue(mockCreatedOrg),
          },
        });
      });

      const result = await organizationService.create(mockUserId, createData);

      expect(uniqueSlug).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedOrg);
    });

    it('should create organization without content settings', async () => {
      const dataWithoutSettings = {
        name: 'New Org',
        mission: 'New mission',
      };
      const mockSlug = 'new-org';
      const mockCreatedOrg = {
        ...mockOrg,
        name: dataWithoutSettings.name,
        slug: mockSlug,
        contentSettings: {},
        members: [{ role: 'OWNER' }],
      };

      (uniqueSlug as jest.Mock).mockResolvedValue(mockSlug);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          organization: {
            create: jest.fn().mockResolvedValue(mockCreatedOrg),
          },
        });
      });

      const result = await organizationService.create(mockUserId, dataWithoutSettings);

      expect(result).toEqual(mockCreatedOrg);
    });
  });

  describe('findById', () => {
    it('should return organization when user is a member', async () => {
      const mockOrgWithSettings = {
        ...mockOrg,
        contentSettings: { primaryKeywords: ['keyword1'] },
      };
      const mockMembership = {
        id: 'membership-1',
        organizationId: mockOrgId,
        userId: mockUserId,
        role: 'OWNER',
      };

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrgWithSettings);
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);

      const result = await organizationService.findById(mockUserId, mockOrgId);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrgId },
        include: {
          contentSettings: true,
        },
      });
      expect(prisma.organizationMember.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_userId: {
            organizationId: mockOrgId,
            userId: mockUserId,
          },
        },
      });
      expect(result).toEqual({ ...mockOrgWithSettings, role: 'OWNER' });
    });

    it('should return null when organization does not exist', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await organizationService.findById(mockUserId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should throw ForbiddenError when user is not a member', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(organizationService.findById(mockUserId, mockOrgId)).rejects.toThrow(
        ForbiddenError
      );
      await expect(organizationService.findById(mockUserId, mockOrgId)).rejects.toThrow(
        'You are not a member of this organization'
      );
    });
  });

  describe('findBySlug', () => {
    it('should return organization when user is a member', async () => {
      const mockOrgWithSettings = {
        ...mockOrg,
        contentSettings: { primaryKeywords: ['keyword1'] },
      };
      const mockMembership = {
        id: 'membership-1',
        organizationId: mockOrgId,
        userId: mockUserId,
        role: 'ADMIN',
      };

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrgWithSettings);
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);

      const result = await organizationService.findBySlug(mockUserId, 'test-org');

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-org' },
        include: {
          contentSettings: true,
        },
      });
      expect(result).toEqual({ ...mockOrgWithSettings, role: 'ADMIN' });
    });

    it('should return null when organization does not exist', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await organizationService.findBySlug(mockUserId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should throw ForbiddenError when user is not a member', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        organizationService.findBySlug(mockUserId, 'test-org')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Org',
      mission: 'Updated mission',
    };

    it('should update organization when user is OWNER', async () => {
      const mockMembership = {
        id: 'membership-1',
        organizationId: mockOrgId,
        userId: mockUserId,
        role: 'OWNER',
      };
      const updatedOrg = { ...mockOrg, ...updateData };

      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrg);

      const result = await organizationService.update(mockUserId, mockOrgId, updateData);

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: mockOrgId },
        data: updateData,
      });
      expect(result).toEqual(updatedOrg);
    });

    it('should update organization when user is ADMIN', async () => {
      const mockMembership = {
        id: 'membership-1',
        organizationId: mockOrgId,
        userId: mockUserId,
        role: 'ADMIN',
      };
      const updatedOrg = { ...mockOrg, ...updateData };

      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);
      (prisma.organization.update as jest.Mock).mockResolvedValue(updatedOrg);

      const result = await organizationService.update(mockUserId, mockOrgId, updateData);

      expect(result).toEqual(updatedOrg);
    });

    it('should throw ForbiddenError when user is not OWNER or ADMIN', async () => {
      const mockMembership = {
        id: 'membership-1',
        organizationId: mockOrgId,
        userId: mockUserId,
        role: 'MEMBER',
      };

      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(mockMembership);

      await expect(
        organizationService.update(mockUserId, mockOrgId, updateData)
      ).rejects.toThrow(ForbiddenError);
      await expect(
        organizationService.update(mockUserId, mockOrgId, updateData)
      ).rejects.toThrow('You do not have permission to update this organization');
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user is not a member', async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        organizationService.update(mockUserId, mockOrgId, updateData)
      ).rejects.toThrow(ForbiddenError);
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });
  });
});
