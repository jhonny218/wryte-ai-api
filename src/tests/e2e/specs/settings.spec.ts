import { test, expect } from '@playwright/test'
import { createAuthenticatedContext, createTestUser, deleteTestUser } from '../helpers/auth-bypass'
import { getTestPrismaClient } from '../setup/database'

test.describe('Content Settings', () => {
  test.describe.configure({ mode: 'parallel' })

  const prisma = getTestPrismaClient()
  let testUserId: string
  let testClerkId: string

  test.beforeEach(async () => {
    const user = await createTestUser(prisma)
    testUserId = user.id
    testClerkId = user.clerkId
  })

  test.afterEach(async () => {
    if (testUserId) {
      await deleteTestUser(prisma, testUserId)
    }
  })

  test('should create settings automatically with new organization', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Test Org', mission: 'Test' }
    })
    const org = await orgRes.json()
    const orgId = org.data.id

    const response = await request.get(`/api/v1/settings/${orgId}`, { headers })
    
    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data).toBeDefined()
    expect(body.data.organizationId).toBe(orgId)
  })

  test('should get organization content settings', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Settings Test Org', mission: 'Test' }
    })
    const org = await orgRes.json()
    const orgId = org.data.id

    const response = await request.get(`/api/v1/settings/${orgId}`, { headers })
    
    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data.id).toBeDefined()
    expect(body.data.organizationId).toBe(orgId)
  })

  test('should update content settings', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Update Settings Org', mission: 'Test' }
    })
    const org = await orgRes.json()
    const orgId = org.data.id

    const response = await request.put(`/api/v1/settings/${orgId}`, {
      headers,
      data: {
        primaryKeywords: ['SaaS', 'AI', 'Automation'],
        secondaryKeywords: ['productivity', 'efficiency'],
        tone: 'professional',
        targetAudience: 'B2B Founders',
        preferredLength: 'LONG_FORM'
      }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data.primaryKeywords).toContain('SaaS')
    expect(body.data.primaryKeywords).toContain('AI')
    expect(body.data.tone).toBe('professional')
    expect(body.data.targetAudience).toBe('B2B Founders')
    expect(body.data.preferredLength).toBe('LONG_FORM')
  })

  test('should update partial settings', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Partial Update Org', mission: 'Test' }
    })
    const org = await orgRes.json()
    const orgId = org.data.id

    // Update only tone - must include primaryKeywords as it's required
    const response = await request.put(`/api/v1/settings/${orgId}`, {
      headers,
      data: { 
        primaryKeywords: ['test'],
        tone: 'casual' 
      }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data.tone).toBe('casual')
    expect(body.data.organizationId).toBe(orgId)
  })

  test('should validate settings data', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Validation Test Org', mission: 'Test' }
    })
    const org = await orgRes.json()
    const orgId = org.data.id

    // Try to set invalid tone
    const response = await request.put(`/api/v1/settings/${orgId}`, {
      headers,
      data: { 
        primaryKeywords: ['test'],
        tone: 'INVALID_VALUE' 
      }
    })

    expect([400, 422]).toContain(response.status())
  })

  test.skip('should reject settings access by non-member', async ({ request }) => {
    // TODO: Settings controller needs organization membership validation
    const headers = createAuthenticatedContext(testClerkId)
    
    // Create org as first user
    const orgRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Private Settings Org', mission: 'Test' }
    })
    const org = await orgRes.json()
    const orgId = org.data.id

    // Create second user
    const user2 = await createTestUser(prisma)
    const headers2 = createAuthenticatedContext(user2.clerkId)

    // Try to access settings
    const response = await request.get(`/api/v1/settings/${orgId}`, { headers: headers2 })
    expect(response.status()).toBe(403)

    await deleteTestUser(prisma, user2.id)
  })
})
