import { test, expect } from '@playwright/test'
import { createAuthenticatedContext, createTestUser, deleteTestUser } from '../helpers/auth-bypass'
import { getTestPrismaClient } from '../setup/database'

const prisma = getTestPrismaClient()

test.describe.configure({ mode: 'parallel' })

test.describe('Outline Generation Workflow', () => {
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
      data: { name: 'Outline Test Org', mission: 'Test mission' }
    })
    const org = await orgRes.json()
    orgId = org.data.id
  })

  test('should create outline generation job', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    // First create a title manually in the database
    const title = await prisma.blogTitle.create({
      data: {
        title: 'Test Blog Title',
        organizationId: orgId,
        status: 'PENDING'
      }
    })

    const response = await request.post(`/api/v1/jobs/outline`, {
      headers,
      data: {
        blogTitleId: title.id
      }
    })

    expect(response.status()).toBe(202)
    const body = await response.json()
    
    expect(body.data.id).toBeDefined()
    expect(body.data.status).toBe('PENDING')
    expect(body.data.type).toBe('GENERATE_OUTLINE')
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

    const response = await request.post(`/api/v1/jobs/outline`, {
      headers,
      data: {
        blogTitleId: title.id,
        additionalInstructions: 'Include specific examples and case studies'
      }
    })

    expect(response.status()).toBe(202)
    const body = await response.json()
    
    expect(body.data.id).toBeDefined()
    expect(body.data.input.additionalInstructions).toBe('Include specific examples and case studies')
  })
})
