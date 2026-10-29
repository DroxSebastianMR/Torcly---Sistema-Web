import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { apiRouter } from './routes.js'
import { requestId } from './middlewares/request-id.js'
import { requestTiming } from './middlewares/request-timing.js'
import { errorHandler } from './middlewares/error-handler.js'
import { AppError } from './shared/errors/app-error.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(requestId)
  app.use(requestTiming)
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use('/api/v1', apiRouter)
  app.use((_request, _response, next) =>
    next(new AppError(404, 'NOT_FOUND', 'Ruta no encontrada.')),
  )
  app.use(errorHandler)
  return app
}
