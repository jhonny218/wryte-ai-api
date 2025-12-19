import { BlogTitle, TitleStatus } from "../../generated/prisma/client";
import { prisma } from "../utils/prisma";

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

  // Helper to fetch settings
  async getContentSettings(organizationId: string) {
    return prisma.contentSettings.findUnique({
      where: { organizationId },
    });
  }
}

export const titleService = new TitleService();
