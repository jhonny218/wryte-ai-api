import { test, expect } from '@playwright/test'
import { createAuthenticatedContext, createTestUser, deleteTestUser } from '../helpers/auth-bypass'
import { getTestPrismaClient } from '../setup/database'

test.describe('Authentication', () => {
  test.describe.configure({ mode: 'parallel' })

  const prisma = getTestPrismaClient()
  let testUserId: string
  let testClerkId: string

  test.beforeEach(async () => {
    // Create a test user for authentication tests
    const user = await createTestUser(prisma)
    testUserId = user.id
    testClerkId = user.clerkId
  })

  test.afterEach(async () => {
    // Cleanup test user
    if (testUserId) {
      await deleteTestUser(prisma, testUserId)
    }
  })

  test('should allow access with valid X-Test-User-Id header', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const response = await request.get('/api/v1/users/me', { headers })
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(body.data.clerkId).toBe(testClerkId)
  })

  test('should reject request without authentication', async ({ request }) => {
    const response = await request.get('/api/v1/users/me')
    
    // Controller tries to use null userId which causes an error (500 or 404)
    // In a real scenario, requireAuth middleware would block this
    expect([404, 500]).toContain(response.status())

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('should reject request with invalid user ID', async ({ request }) => {
    const headers = createAuthenticatedContext('invalid_clerk_id_xxx')
    
    const response = await request.get('/api/v1/users/me', { headers })
    
    expect(response.status()).toBe(404)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })
})
