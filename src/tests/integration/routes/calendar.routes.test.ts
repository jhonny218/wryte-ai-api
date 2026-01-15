import request from 'supertest'
import { calendarRoutes } from '../../../routes/calendar.routes'
import { calendarController } from '../../../controllers/calendar.controller'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/calendar.controller', () => ({
  calendarController: {
    getCalendarEvents: jest.fn(),
  },
}))

describe('calendarRoutes', () => {
  const app = makeRouterApp('/api/v1/calendar', calendarRoutes)

  beforeEach(() => {
    ;(calendarController.getCalendarEvents as jest.Mock).mockImplementation((_req, res) =>
      res.status(200).json({ ok: 'getCalendarEvents' })
    )
  })

  it('GET /api/v1/calendar wires to getCalendarEvents', async () => {
    const res = await request(app).get('/api/v1/calendar')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: 'getCalendarEvents' })
    expect(calendarController.getCalendarEvents).toHaveBeenCalledTimes(1)
  })
})
