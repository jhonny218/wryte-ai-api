import request from 'supertest'
import { outlineRoutes } from '../../../routes/outline.routes'
import { outlineController } from '../../../controllers/outline.controller'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/outline.controller', () => ({
  outlineController: {
    getOutlines: jest.fn(),
    updateOutline: jest.fn(),
    deleteOutline: jest.fn(),
  },
}))

describe('outlineRoutes', () => {
  const app = makeRouterApp('/api/v1/outlines', outlineRoutes)

  beforeEach(() => {
    ;(outlineController.getOutlines as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getOutlines', orgId: req.params.orgId })
    )
    ;(outlineController.updateOutline as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'updateOutline', outlineId: req.params.outlineId })
    )
    ;(outlineController.deleteOutline as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'deleteOutline', outlineId: req.params.outlineId })
    )
  })

  it('GET /api/v1/outlines/:orgId wires to getOutlines', async () => {
    const res = await request(app).get('/api/v1/outlines/org_1')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('getOutlines')
    expect(outlineController.getOutlines).toHaveBeenCalledTimes(1)
  })
})
