import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware.js'
import { getPreventiveMaintenanceReminders } from './preventive-maintenance.controller.js'

export const preventiveMaintenanceRouter = Router()

preventiveMaintenanceRouter.use(requireAuth)
preventiveMaintenanceRouter.get('/', getPreventiveMaintenanceReminders)
