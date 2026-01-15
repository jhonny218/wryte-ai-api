import request from 'supertest'
import { userRoutes } from '../../../routes/user.routes'
import { userController } from '../../../controllers/user.controller'
import { requireAuth } from '../../../middleware/auth.middleware'
import { validate } from '../../../middleware/validation.middleware'
import { createUserSchema, updateUserSchema } from '../../../validators/user.validator'
import { UnauthorizedError } from '../../../utils/errors'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/user.controller', () => ({
  userController: {
    getByClerkId: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getUserOrganizations: jest.fn(),
  },
}))

jest.mock('../../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('../../../middleware/validation.middleware', () => ({
  validate: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}))

describe('userRoutes', () => {
  const app = makeRouterApp('/api/v1/users', userRoutes)

  beforeEach(() => {
    ;(requireAuth as jest.Mock).mockImplementation((_req, _res, next) => next())

    ;(userController.getByClerkId as jest.Mock).mockImplementation((_req, res) =>
      res.status(200).json({ ok: 'getByClerkId' })
    )
  })

  it('registers validate(schema) for POST and PUT', () => {
    jest.isolateModules(() => {
      const { validate } = require('../../../middleware/validation.middleware')
      ;(validate as jest.Mock).mockImplementation(() => (_req: any, _res: any, next: any) => next())

      const { createUserSchema, updateUserSchema } = require('../../../validators/user.validator')
      require('../../../routes/user.routes')

      expect(validate).toHaveBeenCalledWith(createUserSchema)
      expect(validate).toHaveBeenCalledWith(updateUserSchema)
    })
  })

  it('GET /api/v1/users/me wires to getByClerkId', async () => {
    const res = await request(app).get('/api/v1/users/me')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('getByClerkId')
    expect(userController.getByClerkId).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError('nope')
    })
    const res = await request(app).get('/api/v1/users/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
