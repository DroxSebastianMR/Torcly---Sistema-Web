import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createRun,
  getEligibility,
  getRunDetail,
  listRuns,
} from './replenishment.controller.js'

export const replenishmentRouter = Router()

replenishmentRouter.use(requireAuth)
replenishmentRouter.get(
  '/eligibility',
  requirePermission('inventory:read'),
  getEligibility,
)
replenishmentRouter.post(
  '/runs',
  requirePermission('inventory:write'),
  createRun,
)
replenishmentRouter.get('/runs', requirePermission('inventory:read'), listRuns)
replenishmentRouter.get(
  '/runs/:code',
  requirePermission('inventory:read'),
  getRunDetail,
)
