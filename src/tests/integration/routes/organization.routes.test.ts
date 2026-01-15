import request from 'supertest'
import { organizationRoutes } from '../../../routes/organization.routes'
import { organizationController } from '../../../controllers/organization.controller'
import { requireAuth } from '../../../middleware/auth.middleware'
import { validate } from '../../../middleware/validation.middleware'
import { createOrganizationSchema, updateOrganizationSchema } from '../../../validators/organization.validator'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/organization.controller', () => ({
  organizationController: {
    getAll: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    getBySlug: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('../../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('../../../middleware/validation.middleware', () => ({
  validate: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}))

describe('organizationRoutes', () => {
  const app = makeRouterApp('/api/v1/organizations', organizationRoutes)

  beforeEach(() => {
    ;(requireAuth as jest.Mock).mockImplementation((_req, _res, next) => next())

    ;(organizationController.getAll as jest.Mock).mockImplementation((_req, res) =>
      res.status(200).json({ ok: 'getAll' })
    )
    ;(organizationController.create as jest.Mock).mockImplementation((_req, res) =>
      res.status(201).json({ ok: 'create' })
    )
    ;(organizationController.getById as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getById', orgId: req.params.orgId })
    )
    ;(organizationController.getBySlug as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getBySlug', slug: req.params.slug })
    )
    ;(organizationController.update as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'update', orgId: req.params.orgId })
    )
  })

  it('registers validate(schema) for POST and PUT', () => {
    jest.isolateModules(() => {
      const { validate } = require('../../../middleware/validation.middleware')
      ;(validate as jest.Mock).mockImplementation(() => (_req: any, _res: any, next: any) => next())

      const { createOrganizationSchema, updateOrganizationSchema } = require('../../../validators/organization.validator')
      require('../../../routes/organization.routes')

      expect(validate).toHaveBeenCalledWith(createOrganizationSchema)
      expect(validate).toHaveBeenCalledWith(updateOrganizationSchema)
    })
  })

  it('GET /api/v1/organizations wires to getAll', async () => {
    const res = await request(app).get('/api/v1/organizations')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('getAll')
    expect(organizationController.getAll).toHaveBeenCalledTimes(1)
  })

  it('GET /api/v1/organizations/slug/:slug wires to getBySlug', async () => {
    const res = await request(app).get('/api/v1/organizations/slug/acme')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: 'getBySlug', slug: 'acme' })
    expect(organizationController.getBySlug).toHaveBeenCalledTimes(1)
  })
})
