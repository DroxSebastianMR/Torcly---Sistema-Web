import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createTechnician,
  getTechnician,
  getTechnicianOptions,
  listTechnicians,
  updateTechnician,
  updateTechnicianStatus,
} from './technicians.controller.js'
export const techniciansRouter = Router()
techniciansRouter.use(requireAuth)
techniciansRouter.get('/', requirePermission('workshop:read'), listTechnicians)
techniciansRouter.get(
  '/options',
  requirePermission('workshop:read'),
  getTechnicianOptions,
)
techniciansRouter.get('/:id', requirePermission('workshop:read'), getTechnician)
techniciansRouter.post(
  '/',
  requirePermission('workshop:write'),
  createTechnician,
)
techniciansRouter.put(
  '/:id',
  requirePermission('workshop:write'),
  updateTechnician,
)
techniciansRouter.patch(
  '/:id/status',
  requirePermission('workshop:write'),
  updateTechnicianStatus,
)
