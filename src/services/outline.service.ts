import { OutlineStatus } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export class OutlineService {
  async getOutlines(organizationId: string) {
    return prisma.blogOutline.findMany({
      where: {
        blogTitle: {
          organizationId,
        },
      },
      include: {
        blogTitle: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createOutline(blogTitleId: string, data: {
    structure: any;
    seoKeywords: string[];
    metaDescription: string;
    suggestedImages?: string[];
  }) {
    return prisma.blogOutline.create({
      data: {
        blogTitleId,
        structure: data.structure,
        seoKeywords: data.seoKeywords,
        metaDescription: data.metaDescription,
        suggestedImages: data.suggestedImages || [],
        status: OutlineStatus.PENDING,
      },
    });
  }

  async getOutlineByTitleId(blogTitleId: string) {
    return prisma.blogOutline.findUnique({
      where: { blogTitleId },
      include: { blogTitle: true },
    });
  }

  async updateOutline(organizationId: string, outlineId: string, data: {
    structure?: any;
    seoKeywords?: string[];
    metaDescription?: string;
    suggestedImages?: string[];
    status?: OutlineStatus;
  }) {
    // Ensure the outline exists and belongs to the organization
    const existing = await prisma.blogOutline.findUnique({
      where: { id: outlineId },
      include: { blogTitle: true },
    });
    if (!existing) throw new NotFoundError('Outline not found');
    if (existing.blogTitle.organizationId !== organizationId) {
      throw new ForbiddenError('You do not have permission to update this outline');
    }

    return prisma.blogOutline.update({
      where: { id: outlineId },
      data,
    });
  }

  async deleteOutline(organizationId: string, outlineId: string) {
    // Ensure the outline exists and belongs to the organization
    const existing = await prisma.blogOutline.findUnique({
      where: { id: outlineId },
      include: { blogTitle: true },
    });
    if (!existing) throw new NotFoundError('Outline not found');
    if (existing.blogTitle.organizationId !== organizationId) {
      throw new ForbiddenError('You do not have permission to delete this outline');
    }

    await prisma.blogOutline.delete({
      where: { id: outlineId },
    });
  }

  async getOutline(outlineId: string) {
    const outline = await prisma.blogOutline.findUnique({
      where: { id: outlineId },
      include: { blogTitle: true },
    });
    
    if (!outline) throw new NotFoundError('Outline not found');
    return outline;
  }
}

export const outlineService = new OutlineService();
