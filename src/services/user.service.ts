import { prisma } from "../utils/prisma";
import { ConflictError } from "../utils/errors";

class UserService {
  async create (data: any) {
    // Check for existing user with the same email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name || null,
      }
    });

    return user;
  }

  async findById (userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId }
    });
  }

  async findByClerkId (clerkId: string) {
    return await prisma.user.findUnique({
      where: { clerkId }
    });
  }

  async update(clerkId: string, data: any) {
    return await prisma.user.update({
      where: { clerkId },
      data: {
        email: data.email,
        name: data.name,
      }
    })
  }

  async delete(clerkId: string) {
    return await prisma.user.delete({
      where: { clerkId }
    })
  }

  async getUserOrganizations(clerkId: string) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      hasOrganizations: user.organizationMemberships.length > 0,
      organizations: user.organizationMemberships.map(membership => ({
        ...membership.organization,
        role: membership.role
      })),
      primaryOrganization: user.organizationMemberships[0]?.organization || null
    }
  }
}

export const userService = new UserService();