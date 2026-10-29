import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware.js'
import { registerModuleLoad } from './metrics.controller.js'

export const metricsRouter = Router()

metricsRouter.use(requireAuth)
metricsRouter.post('/module-load', registerModuleLoad)
