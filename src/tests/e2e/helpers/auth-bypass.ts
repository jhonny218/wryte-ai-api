import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '../../../../generated/prisma/client'
import { logger } from '../../../utils/logger'

/**
 * Test authentication middleware that bypasses Clerk
 * Reads X-Test-User-Id header and injects auth into request
 */
export function testAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const testUserId = req.headers['x-test-user-id'] as string

  if (testUserId) {
    // Inject auth object that matches Clerk's getAuth structure
    ;(req as any).auth = {
      userId: testUserId,
      sessionId: 'test-session',
      sessionClaims: {},
      actor: undefined,
    }
    logger.debug(`[Auth Bypass] Authenticated as user: ${testUserId}`)
  } else {
    // No auth header - set empty auth object
    ;(req as any).auth = {
      userId: null,
      sessionId: null,
      sessionClaims: null,
      actor: undefined,
    }
  }

  next()
}

/**
 * Create authenticated request context for Playwright API requests
 */
export function createAuthenticatedContext(userId: string): {
  'X-Test-User-Id': string
  'Content-Type': string
} {
  return {
    'X-Test-User-Id': userId,
    'Content-Type': 'application/json',
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  prisma: PrismaClient,
  userData?: {
    clerkId?: string
    email?: string
    name?: string
  }
): Promise<{ id: string; clerkId: string; email: string }> {
  const clerkId = userData?.clerkId || `test_clerk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const email = userData?.email || `test_${Date.now()}@example.com`
  const name = userData?.name || 'Test User'

  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
    },
  })

  logger.info(`[Test User] Created user: ${user.id} (${user.email})`)

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
  }
}

/**
 * Create a test organization with a member
 */
export async function createTestOrganization(
  prisma: PrismaClient,
  userId: string,
  orgData?: {
    name?: string
    slug?: string
    mission?: string
  }
): Promise<{ id: string; slug: string; name: string }> {
  const name = orgData?.name || `Test Org ${Date.now()}`
  const slug = orgData?.slug || `test-org-${Date.now()}`
  const mission = orgData?.mission || 'Test organization for E2E testing'

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      mission,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
  })

  logger.info(`[Test Org] Created organization: ${org.id} (${org.slug})`)

  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
  }
}

/**
 * Create test content settings for an organization
 */
export async function createTestContentSettings(
  prisma: PrismaClient,
  organizationId: string,
  settings?: {
    keywords?: string[]
    tone?: string
    targetAudience?: string
  }
): Promise<{ id: string }> {
  const contentSettings = await prisma.contentSettings.create({
    data: {
      organizationId,
      primaryKeywords: settings?.keywords || ['tech', 'software', 'development'],
      secondaryKeywords: ['tutorial', 'guide', 'best practices'],
      tone: settings?.tone || 'Professional',
      targetAudience: settings?.targetAudience || 'Software developers',
    },
  })

  logger.info(`[Test Settings] Created content settings: ${contentSettings.id}`)

  return {
    id: contentSettings.id,
  }
}

/**
 * Delete test user and all associated data
 */
export async function deleteTestUser(prisma: PrismaClient, userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })
    logger.info(`[Test User] Deleted user: ${userId}`)
  } catch (error) {
    logger.warn(`[Test User] Failed to delete user: ${userId}`, { error })
  }
}

/**
 * Delete test organization and all associated data
 */
export async function deleteTestOrganization(prisma: PrismaClient, orgId: string): Promise<void> {
  try {
    await prisma.organization.delete({
      where: { id: orgId },
    })
    logger.info(`[Test Org] Deleted organization: ${orgId}`)
  } catch (error) {
    logger.warn(`[Test Org] Failed to delete organization: ${orgId}`, { error })
  }
}
