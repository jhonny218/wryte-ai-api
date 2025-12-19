import { prisma } from "../utils/prisma";
import { ForbiddenError } from "../utils/errors";
import { uniqueSlug } from "../utils/slug";

class OrganizationService {
  async findAll(userId: string) {
    return await prisma.organization.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          where: { userId },
          select: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async create(userId: string, data: any) {
    // 1. Generate unique slug
    const slug = await uniqueSlug(
      data.name,
      async (slug: string) => {
        const existingSlug = await prisma.organization.findUnique({ where: { slug } })
        return !!existingSlug
      }
    )

    // 2. Prepare content settings data (if provided)
    const contentSettingsData = data.contentSettings ? {
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
    } : {}

    // 3. Create Org + Member + Settings (Transaction)
    return await prisma.$transaction(async (tx) => {
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
              role: 'OWNER'
            }
          },
          contentSettings: {
            create: contentSettingsData
          }
        },
        include: {
          contentSettings: true,
          members: {
            where: { userId },
            select: { role: true }
          }
        }
      })

      return org
    })
  }

  async findById(userId: string, orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        contentSettings: true,
      }
    })

    if (!org) return null

    // Check mebmbership
    const isMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId
        }
      }
    })

    if (!isMember) {
      throw new ForbiddenError('You are not a member of this organization')
    }

    return { ...org, role: isMember.role }
  }

  async findBySlug(userId: string, slug: string) {
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: {
        contentSettings: true,
      }
    })

    if (!org) return null

    // Check membership
    const isMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId
        }
      }
    })

    if (!isMember) {
      throw new ForbiddenError('You are not a member of this organization')
    }

    return { ...org, role: isMember.role }
  }

  async update(userId: string, orgId: string, data: any) {
    // Check membership & role (must be ADMIN or OWNER)
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenError('You do not have permission to update this organization')
    }

    return await prisma.organization.update({
      where: { id: orgId },
      data
    })
  }
}

export const organizationService = new OrganizationService();