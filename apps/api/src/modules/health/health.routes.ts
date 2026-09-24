import { Router } from 'express'
import {
  databaseHealthController,
  healthController,
} from './health.controller.js'

export const healthRouter = Router()

healthRouter.get('/', healthController)
healthRouter.get('/database', databaseHealthController)
