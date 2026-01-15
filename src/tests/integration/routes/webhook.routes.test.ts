import request from 'supertest'
import { webhookRoutes } from '../../../routes/webhook.routes'
import { Webhook } from 'svix'
import { userService } from '../../../services/user.service'
import { makeRouterApp } from './_testApp'

jest.mock('svix', () => ({
  Webhook: jest.fn(),
}))

jest.mock('../../../services/user.service', () => ({
  userService: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('webhookRoutes', () => {
  const app = makeRouterApp('/api/v1/webhooks', webhookRoutes)

  beforeEach(() => {
    ;(userService.create as jest.Mock).mockResolvedValue(undefined)
    ;(userService.update as jest.Mock).mockResolvedValue(undefined)
    ;(userService.delete as jest.Mock).mockResolvedValue(undefined)
  })

  it('returns 400 when svix headers are missing', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/clerk')
      .set('content-type', 'application/json')
      .send({ type: 'user.created', data: {} })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing svix headers' })
  })

  it('returns 400 when verification fails', async () => {
    ;(Webhook as unknown as jest.Mock).mockImplementation(() => ({
      verify: jest.fn(() => {
        throw new Error('bad sig')
      }),
    }))

    const res = await request(app)
      .post('/api/v1/webhooks/clerk')
      .set('svix-id', 'id')
      .set('svix-timestamp', 'ts')
      .set('svix-signature', 'sig')
      .set('content-type', 'application/json')
      .send({ type: 'user.created', data: {} })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Webhook verification failed' })
  })

  it('returns 200 and calls userService.create on user.created', async () => {
    ;(Webhook as unknown as jest.Mock).mockImplementation(() => ({
      verify: jest.fn(() => ({
        type: 'user.created',
        data: {
          id: 'user_1',
          email_addresses: [{ email_address: 'a@b.com' }],
          first_name: 'A',
          last_name: 'B',
        },
      })),
    }))

    const res = await request(app)
      .post('/api/v1/webhooks/clerk')
      .set('svix-id', 'id')
      .set('svix-timestamp', 'ts')
      .set('svix-signature', 'sig')
      .set('content-type', 'application/json')
      .send({ type: 'user.created', data: {} })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Webhook processed successfully' })
    expect(userService.create).toHaveBeenCalledTimes(1)
  })
})
