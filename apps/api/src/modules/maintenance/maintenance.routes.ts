import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  cancelMaintenance,
  getMaintenanceStatus,
  listMaintenanceWindows,
  scheduleMaintenance,
} from './maintenance.controller.js'

export const maintenanceRouter = Router()

maintenanceRouter.get('/', getMaintenanceStatus)
maintenanceRouter.get(
  '/windows',
  requireAuth,
  requirePermission('maintenance:read'),
  listMaintenanceWindows,
)
maintenanceRouter.post(
  '/windows',
  requireAuth,
  requirePermission('maintenance:write'),
  scheduleMaintenance,
)
maintenanceRouter.delete(
  '/windows/:id',
  requireAuth,
  requirePermission('maintenance:write'),
  cancelMaintenance,
)
