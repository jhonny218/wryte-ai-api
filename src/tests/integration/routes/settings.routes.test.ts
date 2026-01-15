import request from 'supertest'
import { settingsRoutes } from '../../../routes/settings.routes'
import { settingsController } from '../../../controllers/settings.controller'
import { requireAuth } from '../../../middleware/auth.middleware'
import { validate } from '../../../middleware/validation.middleware'
import { upsertContentSettingsSchema } from '../../../validators/settings.validator'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/settings.controller', () => ({
  settingsController: {
    getByOrgId: jest.fn(),
    upsert: jest.fn(),
  },
}))

jest.mock('../../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('../../../middleware/validation.middleware', () => ({
  validate: jest.fn(() => (_req: any, _res: any, next: any) => next()),
}))

describe('settingsRoutes', () => {
  const app = makeRouterApp('/api/v1/settings', settingsRoutes)

  beforeEach(() => {
    ;(requireAuth as jest.Mock).mockImplementation((_req, _res, next) => next())
    ;(settingsController.getByOrgId as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getByOrgId', orgId: req.params.orgId })
    )
    ;(settingsController.upsert as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'upsert', orgId: req.params.orgId })
    )
  })

  it('registers validate(schema) for PUT', () => {
    jest.isolateModules(() => {
      const { validate } = require('../../../middleware/validation.middleware')
      ;(validate as jest.Mock).mockImplementation(() => (_req: any, _res: any, next: any) => next())

      const { upsertContentSettingsSchema } = require('../../../validators/settings.validator')
      require('../../../routes/settings.routes')

      expect(validate).toHaveBeenCalledWith(upsertContentSettingsSchema)
    })
  })

  it('GET /api/v1/settings/:orgId wires to getByOrgId', async () => {
    const res = await request(app).get('/api/v1/settings/org_1')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('getByOrgId')
    expect(settingsController.getByOrgId).toHaveBeenCalledTimes(1)
  })
})
