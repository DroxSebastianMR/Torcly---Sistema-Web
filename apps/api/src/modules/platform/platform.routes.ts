import { Router } from 'express'
import { requireAuth, requirePlatformAdmin } from '../auth/auth.middleware.js'
import { getPlatformAccess } from './platform.controller.js'

export const platformRouter = Router()

platformRouter.use(requireAuth, requirePlatformAdmin)
platformRouter.get('/access', getPlatformAccess)
