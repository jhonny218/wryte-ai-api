import request from 'supertest'
import { titleRoutes } from '../../../routes/title.routes'
import { titleController } from '../../../controllers/title.controller'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/title.controller', () => ({
  titleController: {
    getTitles: jest.fn(),
    updateTitle: jest.fn(),
    deleteTitle: jest.fn(),
  },
}))

describe('titleRoutes', () => {
  const app = makeRouterApp('/api/v1/titles', titleRoutes)

  beforeEach(() => {
    ;(titleController.getTitles as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getTitles', orgId: req.params.orgId })
    )
  })

  it('GET /api/v1/titles/:orgId wires to getTitles', async () => {
    const res = await request(app).get('/api/v1/titles/org_1')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('getTitles')
    expect(titleController.getTitles).toHaveBeenCalledTimes(1)
  })
})
