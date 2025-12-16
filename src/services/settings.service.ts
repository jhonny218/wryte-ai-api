import { prisma } from "../utils/prisma";

class SettingsService {
  async upsert (orgId: string, data: any) {
    return await prisma.contentSettings.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        ...data
      },
      update: {
        ...data
      }
    })
  }

  async getByOrgId (orgId: string) {
    return await prisma.contentSettings.findUnique({
      where: { organizationId: orgId }
    })
  }
}

export const settingsService = new SettingsService();