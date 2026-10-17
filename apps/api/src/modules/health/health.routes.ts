import { Router } from 'express'
import {
  databaseHealthController,
  healthController,
  readinessController,
} from './health.controller.js'

export const healthRouter = Router()

healthRouter.get('/', healthController)
healthRouter.get('/database', databaseHealthController)
healthRouter.get('/readiness', readinessController)
