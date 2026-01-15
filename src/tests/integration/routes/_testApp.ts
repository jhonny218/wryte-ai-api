import express, { type Router } from 'express'
import { errorMiddleware } from '../../../middleware/error.middleware'

export function makeRouterApp(mountPath: string, router: Router) {
  const app = express()

  // Match app.ts ordering
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }))

  app.use(mountPath, router)
  app.use(errorMiddleware)

  return app
}
