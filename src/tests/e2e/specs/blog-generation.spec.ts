import { test, expect } from '@playwright/test'
import { createAuthenticatedContext, createTestUser, deleteTestUser } from '../helpers/auth-bypass'
import { getTestPrismaClient } from '../setup/database'

const prisma = getTestPrismaClient()

test.describe.configure({ mode: 'parallel' })

test.describe('Blog Generation Workflow', () => {
  let testClerkId: string
  let testUserId: string
  let orgId: string

  test.beforeAll(async () => {
    const user = await createTestUser(prisma)
    testClerkId = user.clerkId
    testUserId = user.id
  })

  test.afterAll(async () => {
    if (testUserId) {
      await deleteTestUser(prisma, testUserId)
    }
  })

  test.beforeEach(async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Blog Test Org', mission: 'Test mission' }
    })
    const org = await orgRes.json()
    orgId = org.data.id
  })

  test('should create blog generation job', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    // Create title and outline first
    const title = await prisma.blogTitle.create({
      data: {
        title: 'Test Blog Title',
        organizationId: orgId,
        status: 'PENDING'
      }
    })

    const outline = await prisma.blogOutline.create({
      data: {
        blogTitleId: title.id,
        structure: { sections: [] },
        status: 'PENDING'
      }
    })

    const response = await request.post(`/api/v1/jobs/blog`, {
      headers,
      data: {
        blogOutlineId: outline.id
      }
    })

    expect(response.status()).toBe(202)
    const body = await response.json()
    
    expect(body.data.id).toBeDefined()
    expect(body.data.status).toBe('PENDING')
    expect(body.data.type).toBe('GENERATE_BLOG')
  })

  test('should accept additional instructions', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const title = await prisma.blogTitle.create({
      data: {
        title: 'Another Test Title',
        organizationId: orgId,
        status: 'PENDING'
      }
    })

    const outline = await prisma.blogOutline.create({
      data: {
        blogTitleId: title.id,
        structure: { sections: [] },
        status: 'PENDING'
      }
    })

    const response = await request.post(`/api/v1/jobs/blog`, {
      headers,
      data: {
        blogOutlineId: outline.id,
        additionalInstructions: 'Make it conversational and engaging'
      }
    })

    expect(response.status()).toBe(202)
    const body = await response.json()
    
    expect(body.data.id).toBeDefined()
    expect(body.data.input.additionalInstructions).toBe('Make it conversational and engaging')
  })
})
