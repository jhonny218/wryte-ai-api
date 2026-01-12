import { BlogTitle, TitleStatus } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export type UpdateTitleInput = {
  title?: string;
  status?: TitleStatus;
  scheduledDate?: Date | null;
  aiGenerationContext?: any;
}

export class TitleService {
  async getTitles(organizationId: string) {
    return prisma.blogTitle.findMany({
      where: { organizationId },
      include: { outline: true },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  async createTitlesWithDates(organizationId: string, items: { title: string, date: Date }[]) {
    if (items.length === 0) return;

    const data = items.map(item => ({
      organizationId,
      title: item.title,
      status: TitleStatus.PENDING,
      scheduledDate: item.date,
    }));

    return prisma.blogTitle.createMany({
      data,
    });
  }

  // Legacy/Simple creation - keeping for compatibility if needed, but updating signature to match usage if needed? 
  // Actually the previous usage was createTitles(orgId, string[], date?). 
  // I will deprecate or remove it if unused, but let's keep it for now as an overload or separate method.
  async createTitles(organizationId: string, titles: string[], scheduledDate?: Date) {
    if (titles.length === 0) return;

    const data = titles.map(title => ({
      organizationId,
      title,
      status: TitleStatus.PENDING,
      scheduledDate: scheduledDate || null,
    }));

    return prisma.blogTitle.createMany({
      data,
    });
  }

  async updateTitle(organizationId: string, titleId: string, data: UpdateTitleInput) {
    // Ensure the title exists and belongs to the organization
    const existing = await prisma.blogTitle.findUnique({ where: { id: titleId } });
    if (!existing) throw new NotFoundError('Title not found')
    if (existing.organizationId !== organizationId) {
      throw new ForbiddenError('You do not have permission to update this title')
    }

    // Restrict which fields may be updated to avoid accidental overwrites
    const updateData: UpdateTitleInput = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.status !== undefined) updateData.status = data.status
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate
    if (data.aiGenerationContext !== undefined) updateData.aiGenerationContext = data.aiGenerationContext

    const updated = await prisma.blogTitle.update({
      where: { id: titleId },
      data: updateData
    })

    return updated
  }

  async deleteTitle(organizationId: string, titleId: string) {
    // Ensure the title exists and belongs to the organization
    const existing = await prisma.blogTitle.findUnique({ where: { id: titleId } });
    if (!existing) throw new NotFoundError('Title not found')
    if (existing.organizationId !== organizationId) {
      throw new ForbiddenError('You do not have permission to delete this title')
    }

    await prisma.blogTitle.delete({
      where: { id: titleId }
    })
  }

  // Helper to fetch settings
  async getContentSettings(organizationId: string) {
    return prisma.contentSettings.findUnique({
      where: { organizationId },
    });
  }

  // year=2024&month=02&organizationId
  getCalendarEvents(year: string, month: string, organizationId: string) {
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new NotFoundError('Invalid year or month');
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of the month

    return prisma.blogTitle.findMany({
      where: {
        organizationId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}

export const titleService = new TitleService();
