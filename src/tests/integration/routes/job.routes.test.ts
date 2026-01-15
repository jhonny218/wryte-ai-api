import request from 'supertest'
import { jobRoutes } from '../../../routes/job.routes'
import { jobController } from '../../../controllers/job.controller'
import { requireAuth } from '../../../middleware/auth.middleware'
import { rateLimitMiddleware } from '../../../middleware/rate-limit.middleware'
import { UnauthorizedError } from '../../../utils/errors'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/job.controller', () => ({
  jobController: {
    getJobStatus: jest.fn(),
    createTitleGenerationJob: jest.fn(),
    createOutlineGenerationJob: jest.fn(),
    createBlogGenerationJob: jest.fn(),
  },
}))

jest.mock('../../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('../../../middleware/rate-limit.middleware', () => ({
  rateLimitMiddleware: jest.fn(),
}))

describe('jobRoutes', () => {
  const app = makeRouterApp('/api/v1/jobs', jobRoutes)

  beforeEach(() => {
    ;(requireAuth as jest.Mock).mockImplementation((_req, _res, next) => next())
    ;(rateLimitMiddleware as jest.Mock).mockImplementation((_req, _res, next) => next())

    ;(jobController.getJobStatus as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getJobStatus', jobId: req.params.jobId })
    )
    ;(jobController.createTitleGenerationJob as jest.Mock).mockImplementation((_req, res) =>
      res.status(200).json({ ok: 'createTitleGenerationJob' })
    )
    ;(jobController.createOutlineGenerationJob as jest.Mock).mockImplementation((_req, res) =>
      res.status(200).json({ ok: 'createOutlineGenerationJob' })
    )
    ;(jobController.createBlogGenerationJob as jest.Mock).mockImplementation((_req, res) =>
      res.status(200).json({ ok: 'createBlogGenerationJob' })
    )
  })

  it('GET /api/v1/jobs/:jobId wires to getJobStatus and does not hit rate limiter', async () => {
    const res = await request(app).get('/api/v1/jobs/job_1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: 'getJobStatus', jobId: 'job_1' })
    expect(jobController.getJobStatus).toHaveBeenCalledTimes(1)
    expect(rateLimitMiddleware).not.toHaveBeenCalled()
  })

  it('POST /api/v1/jobs/title hits rate limiter then handler', async () => {
    const res = await request(app).post('/api/v1/jobs/title').send({ prompt: 'x' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('createTitleGenerationJob')
    expect(rateLimitMiddleware).toHaveBeenCalledTimes(1)
    expect(jobController.createTitleGenerationJob).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError('nope')
    })

    const res = await request(app).get('/api/v1/jobs/job_1')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
