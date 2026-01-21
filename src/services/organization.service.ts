import { prisma } from "../utils/prisma";
import { ForbiddenError } from "../utils/errors";
import { uniqueSlug } from "../utils/slug";
import { logger } from "../utils/logger";

class OrganizationService {
  async findAll(userId: string) {
    const orgs = await prisma.organization.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten role from members array to top-level property
    return orgs.map((org) => ({
      ...org,
      role: org.members[0]?.role,
      members: undefined, // Remove members array from response
    }));
  }

  async create(userId: string, data: any) {
    // 1. Generate unique slug
    const slug = await uniqueSlug(data.name, async (slug: string) => {
      const existingSlug = await prisma.organization.findUnique({
        where: { slug },
      });
      return !!existingSlug;
    });

    // 2. Prepare content settings data (if provided)
    const contentSettingsData = data.contentSettings
      ? {
          primaryKeywords: data.contentSettings.primaryKeywords,
          secondaryKeywords: data.contentSettings.secondaryKeywords || [],
          postingDaysOfWeek: data.contentSettings.postingDaysOfWeek || [],
          tone: data.contentSettings.tone || null,
          targetAudience: data.contentSettings.targetAudience || null,
          industry: data.contentSettings.industry || null,
          goals: data.contentSettings.goals || [],
          competitorUrls: data.contentSettings.competitorUrls || [],
          topicsToAvoid: data.contentSettings.topicsToAvoid || [],
          preferredLength: data.contentSettings.preferredLength || null,
        }
      : {};

    // 3. Create Org + Member + Settings (Transaction)
    const org = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          mission: data.mission || null,
          description: data.description || null,
          websiteUrl: data.websiteUrl || null,
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
          contentSettings: {
            create: contentSettingsData,
          },
        },
        include: {
          contentSettings: true,
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      });

      return org;
    });

    logger.info("Organization created", {
      event: "organization_created",
      organizationId: org.id,
      slug: org.slug,
      userId,
      hasContentSettings: !!data.contentSettings,
    });

    return org;
  }

  async findById(userId: string, orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        contentSettings: true,
      },
    });

    if (!org) return null;

    // Check membership
    const isMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!isMember) {
      logger.warn("Organization access denied", {
        event: "organization_access_denied",
        organizationId: orgId,
        userId,
        reason: "not_member",
      });
      throw new ForbiddenError("You are not a member of this organization");
    }

    return { ...org, role: isMember.role };
  }

  async findBySlug(userId: string, slug: string) {
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: {
        contentSettings: true,
      },
    });

    if (!org) return null;

    // Check membership
    const isMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId,
        },
      },
    });

    if (!isMember) {
      logger.warn("Organization access denied", {
        event: "organization_access_denied",
        organizationId: org.id,
        slug,
        userId,
        reason: "not_member",
      });
      throw new ForbiddenError("You are not a member of this organization");
    }

    return { ...org, role: isMember.role };
  }

  async update(userId: string, orgId: string, data: any) {
    // Check membership & role (must be ADMIN or OWNER)
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      logger.warn("Organization update denied", {
        event: "organization_update_denied",
        organizationId: orgId,
        userId,
        role: membership?.role || "none",
      });
      throw new ForbiddenError(
        "You do not have permission to update this organization"
      );
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data,
    });

    logger.info("Organization updated", {
      event: "organization_updated",
      organizationId: orgId,
      userId,
      updatedFields: Object.keys(data),
    });

    return org;
  }
}

export const organizationService = new OrganizationService();
