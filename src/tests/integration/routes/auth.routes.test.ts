import request from 'supertest'
import { authRoutes } from '../../../routes/auth.routes'
import { requireAuth } from '../../../middleware/auth.middleware'
import { UnauthorizedError } from '../../../utils/errors'
import { makeRouterApp } from './_testApp'

jest.mock('../../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
}))

describe('authRoutes', () => {
  const app = makeRouterApp('/api/v1/auth', authRoutes)

  beforeEach(() => {
    ;(requireAuth as jest.Mock).mockImplementation((_req, _res, next) => next())
  })

  it('GET /api/v1/auth/auth/login returns 200 when authenticated', async () => {
    const res = await request(app).get('/api/v1/auth/auth/login')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Login successful' })
    expect(requireAuth).toHaveBeenCalledTimes(1)
  })

  it('GET /api/v1/auth/auth/login returns 401 when unauthenticated', async () => {
    ;(requireAuth as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError('You must be signed in to access this resource')
    })

    const res = await request(app).get('/api/v1/auth/auth/login')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
