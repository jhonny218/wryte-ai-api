import { test, expect } from '@playwright/test'
import { createAuthenticatedContext, createTestUser, deleteTestUser } from '../helpers/auth-bypass'
import { getTestPrismaClient } from '../setup/database'

test.describe('Organizations', () => {
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

  test('should create organization with valid data', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const response = await request.post('/api/v1/organizations', {
      headers,
      data: {
        name: 'Acme Corp',
        mission: 'Simplify productivity',
        websiteUrl: 'https://acme.com'
      }
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    
    expect(body.data).toBeDefined()
    expect(body.data.name).toBe('Acme Corp')
    expect(body.data.slug).toBeDefined()
    expect(body.data.mission).toBe('Simplify productivity')
  })

  test('should generate unique slug for organization', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const org1 = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Test Company', mission: 'Test' }
    })
    const body1 = await org1.json()

    const org2 = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Test Company', mission: 'Test' }
    })
    const body2 = await org2.json()

    expect(body1.data.slug).toBeDefined()
    expect(body2.data.slug).toBeDefined()
    expect(body1.data.slug).not.toBe(body2.data.slug)
  })

  test('should get all user organizations', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    // Create 2 organizations
    await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Org 1', mission: 'Mission 1' }
    })
    await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Org 2', mission: 'Mission 2' }
    })

    const response = await request.get('/api/v1/organizations', { headers })
    
    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data).toHaveLength(2)
    expect(body.data[0].name).toBeDefined()
    expect(body.data[0].role).toBe('OWNER')
  })

  test('should get single organization by ID', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const createRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Single Org', mission: 'Test mission' }
    })
    const created = await createRes.json()
    const orgId = created.data.id

    const response = await request.get(`/api/v1/organizations/${orgId}`, { headers })
    
    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data.id).toBe(orgId)
    expect(body.data.name).toBe('Single Org')
    expect(body.data.mission).toBe('Test mission')
  })

  test('should update organization details', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const createRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Original Name', mission: 'Original mission' }
    })
    const created = await createRes.json()
    const orgId = created.data.id

    const response = await request.put(`/api/v1/organizations/${orgId}`, {
      headers,
      data: {
        name: 'Updated Name',
        websiteUrl: 'https://updated.com'
      }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    
    expect(body.data.name).toBe('Updated Name')
    expect(body.data.websiteUrl).toBe('https://updated.com')
  })

  test.skip('should delete organization', async ({ request }) => {
    // TODO: Implement delete route
    const headers = createAuthenticatedContext(testClerkId)
    
    const createRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'To Delete', mission: 'Will be deleted' }
    })
    const created = await createRes.json()
    const orgId = created.data.id

    const deleteRes = await request.delete(`/api/v1/organizations/${orgId}`, { headers })
    expect(deleteRes.status()).toBe(200)

    // Verify it's deleted
    const getRes = await request.get(`/api/v1/organizations/${orgId}`, { headers })
    expect(getRes.status()).toBe(404)
  })

  test('should reject access to organization user does not belong to', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    // Create org as first user
    const createRes = await request.post('/api/v1/organizations', {
      headers,
      data: { name: 'Private Org', mission: 'Test' }
    })
    const created = await createRes.json()
    const orgId = created.data.id

    // Create second user
    const user2 = await createTestUser(prisma)
    const headers2 = createAuthenticatedContext(user2.clerkId)

    // Try to access first user's org
    const response = await request.get(`/api/v1/organizations/${orgId}`, { headers: headers2 })
    expect(response.status()).toBe(403)

    await deleteTestUser(prisma, user2.id)
  })

  test('should reject invalid organization data', async ({ request }) => {
    const headers = createAuthenticatedContext(testClerkId)
    
    const response = await request.post('/api/v1/organizations', {
      headers,
      data: { name: '' } // Empty name should fail validation
    })

    expect([400, 422]).toContain(response.status())
  })
})
