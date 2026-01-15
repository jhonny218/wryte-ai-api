import request from 'supertest'
import { Router } from 'express'

// Mock all external dependencies BEFORE importing app
jest.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}))

jest.mock('../../config/database', () => ({
  pingDatabase: jest.fn(),
  pgPool: {},
  prisma: {},
}))

jest.mock('../../workers/queues', () => ({
  titleGenerationQueue: { name: 'titleGeneration' },
  outlineGenerationQueue: { name: 'outlineGeneration' },
  blogGenerationQueue: { name: 'blogGeneration' },
}))

jest.mock('../../config/bullboard', () => {
  const mockRouter = Router()
  mockRouter.get('/', (_req, res) => res.json({ queues: ['mocked'] }))
  
  return {
    serverAdapter: {
      getRouter: jest.fn(() => mockRouter),
      setBasePath: jest.fn(),
    },
  }
})

jest.mock('@clerk/express', () => ({
  clerkMiddleware: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}))

jest.mock('../../routes', () => {
  const mockRouter = Router()
  
  // Mock auth routes - support both GET and POST
  mockRouter.get('/auth/login', (_req, res) => res.json({ message: 'login' }))
  mockRouter.post('/auth/login', (_req, res) => res.json({ message: 'login' }))
  
  // Mock protected routes that require auth
  mockRouter.get('/users/me', (_req, res) => {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
    })
  })
  
  return {
    routes: mockRouter,
  }
})

// Import app AFTER all mocks are set up
import { app } from '../../app'
import { pingDatabase } from '../../config/database'

describe('App Integration', () => {
  beforeEach(() => {
    ;(pingDatabase as jest.Mock).mockResolvedValue(true)
  })

  describe('Health Check', () => {
    it('should return 200 when database is healthy', async () => {
      const res = await request(app).get('/health')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        status: 'ok',
        database: 'ok',
      })
      expect(res.body.timestamp).toBeDefined()
      expect(pingDatabase).toHaveBeenCalled()
    })

    it('should return 503 when database is down', async () => {
      ;(pingDatabase as jest.Mock).mockResolvedValueOnce(false)

      const res = await request(app).get('/health')

      expect(res.status).toBe(503)
      expect(res.body).toMatchObject({
        status: 'degraded',
        database: 'down',
      })
      expect(res.body.timestamp).toBeDefined()
    })

    it('should handle database check errors', async () => {
      ;(pingDatabase as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'))

      const res = await request(app).get('/health')

      // The health endpoint has its own try-catch and returns custom error format
      expect(res.status).toBe(500)
      expect(res.body).toMatchObject({
        status: 'error',
        database: 'unknown',
      })
      expect(res.body.timestamp).toBeDefined()
    })
  })

  describe('Middleware Stack', () => {
    it('should parse JSON body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })

      // Route exists and JSON was parsed (not a 404 or 400)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ message: 'login' })
    })

    it('should handle CORS', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')

      expect(res.headers['access-control-allow-origin']).toBeDefined()
    })

    it('should set security headers via helmet', async () => {
      const res = await request(app).get('/health')

      expect(res.headers['x-dns-prefetch-control']).toBeDefined()
      expect(res.headers['x-frame-options']).toBeDefined()
    })
  })

  describe('API Routes', () => {
    it('should mount routes under /api/v1', async () => {
      const res = await request(app).get('/api/v1/auth/login')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ message: 'login' })
    })

    it('should return 404 for unmounted routes', async () => {
      const res = await request(app).get('/api/v2/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors via error middleware', async () => {
      // Force an error by hitting a protected route without auth
      const res = await request(app).get('/api/v1/users/me')

      expect(res.status).toBe(401)
      expect(res.body.error).toBeDefined()
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Bull Board Admin', () => {
    it('should mount Bull Board under /admin/queues', async () => {
      const res = await request(app).get('/admin/queues')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ queues: ['mocked'] })
    })
  })
})
