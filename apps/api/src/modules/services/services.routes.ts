import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createService,
  getService,
  getServiceOptions,
  listServices,
  updateService,
  updateServiceStatus,
} from './services.controller.js'

export const servicesRouter = Router()

servicesRouter.use(requireAuth)
servicesRouter.get('/', requirePermission('services:read'), listServices)
servicesRouter.get(
  '/options',
  requirePermission('services:read'),
  getServiceOptions,
)
servicesRouter.get('/:id', requirePermission('services:read'), getService)
servicesRouter.post('/', requirePermission('services:write'), createService)
servicesRouter.put('/:id', requirePermission('services:write'), updateService)
servicesRouter.patch(
  '/:id/status',
  requirePermission('services:write'),
  updateServiceStatus,
)
