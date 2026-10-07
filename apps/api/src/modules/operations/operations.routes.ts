import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  getOperationsAttention,
  getOperationsSummary,
} from './operations.controller.js'

export const operationsRouter = Router()

operationsRouter.use(requireAuth)
operationsRouter.get(
  '/summary',
  requirePermission('dashboard:read'),
  getOperationsSummary,
)
operationsRouter.get(
  '/attention/:section',
  requirePermission('dashboard:read'),
  getOperationsAttention,
)
