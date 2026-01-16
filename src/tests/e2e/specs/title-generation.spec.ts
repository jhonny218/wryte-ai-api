import { test, expect } from '@playwright/test'
import { createAuthenticatedContext, createTestUser, deleteTestUser } from '../helpers/auth-bypass'
import { getTestPrismaClient } from '../setup/database'

const prisma = getTestPrismaClient()

test.describe.configure({ mode: 'parallel' })

test.describe('Title Generation Workflow', () => {
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
      data: { name: 'Title Test Org', mission: 'Test mission' }
    })
    const org = await orgRes.json()
    orgId = org.data.id
  })

  test('should create title generation job', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const response = await request.post(`/api/v1/jobs/title`, {
      headers,
      data: {
        organizationId: orgId,
        dates: ['2024-01-15', '2024-01-16', '2024-01-17']
      }
    })

    expect(response.status()).toBe(202)
    const body = await response.json()
    
    expect(body.data.id).toBeDefined()
    expect(body.data.status).toBe('PENDING')
    expect(body.data.type).toBe('GENERATE_TITLES')
    expect(body.data.organizationId).toBe(orgId)
  })
})
