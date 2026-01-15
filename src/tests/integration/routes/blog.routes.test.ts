import request from 'supertest'
import { blogRoutes } from '../../../routes/blog.routes'
import { blogController } from '../../../controllers/blog.controller'
import { makeRouterApp } from './_testApp'

jest.mock('../../../controllers/blog.controller', () => ({
  blogController: {
    getBlogs: jest.fn(),
    updateBlog: jest.fn(),
    deleteBlog: jest.fn(),
  },
}))

describe('blogRoutes', () => {
  const app = makeRouterApp('/api/v1/blogs', blogRoutes)

  beforeEach(() => {
    ;(blogController.getBlogs as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'getBlogs', orgId: req.params.orgId })
    )
    ;(blogController.updateBlog as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'updateBlog', orgId: req.params.orgId, blogId: req.params.blogId })
    )
    ;(blogController.deleteBlog as jest.Mock).mockImplementation((req, res) =>
      res.status(200).json({ ok: 'deleteBlog', orgId: req.params.orgId, blogId: req.params.blogId })
    )
  })

  it('GET /api/v1/blogs/:orgId wires to getBlogs', async () => {
    const res = await request(app).get('/api/v1/blogs/org_1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: 'getBlogs', orgId: 'org_1' })
    expect(blogController.getBlogs).toHaveBeenCalledTimes(1)
  })

  it('PUT /api/v1/blogs/:orgId/:blogId wires to updateBlog', async () => {
    const res = await request(app).put('/api/v1/blogs/org_1/blog_1').send({ title: 'x' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('updateBlog')
    expect(blogController.updateBlog).toHaveBeenCalledTimes(1)
  })

  it('DELETE /api/v1/blogs/:orgId/:blogId wires to deleteBlog', async () => {
    const res = await request(app).delete('/api/v1/blogs/org_1/blog_1')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe('deleteBlog')
    expect(blogController.deleteBlog).toHaveBeenCalledTimes(1)
  })
})
