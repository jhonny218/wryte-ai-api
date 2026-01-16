import { test, expect } from '@playwright/test'

test.describe('Health Check', () => {
  test.describe.configure({ mode: 'parallel' })

  test('should return 200 for health endpoint', async ({ request }) => {
    const response = await request.get('/health')
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('status', 'ok')
    expect(body).toHaveProperty('database', 'ok')
    expect(body).toHaveProperty('mode', 'test')
    expect(body).toHaveProperty('timestamp')
  })

  test('should include timestamp in ISO format', async ({ request }) => {
    const response = await request.get('/health')
    const body = await response.json()

    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('should respond quickly', async ({ request }) => {
    const start = Date.now()
    await request.get('/health')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(1000) // Should respond within 1 second
  })
})
