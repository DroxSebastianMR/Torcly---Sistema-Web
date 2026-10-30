import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  closeCashSession,
  getCashSession,
  getCurrentCashSession,
  listCashSessions,
  openCashSession,
} from './cash-session.controller.js'

export const cashSessionsRouter = Router()

cashSessionsRouter.use(requireAuth)
cashSessionsRouter.get(
  '/current',
  requirePermission('cash:read'),
  getCurrentCashSession,
)
cashSessionsRouter.get('/', requirePermission('cash:read'), listCashSessions)
cashSessionsRouter.get('/:id', requirePermission('cash:read'), getCashSession)
cashSessionsRouter.post(
  '/open',
  requirePermission('cash:write'),
  openCashSession,
)
cashSessionsRouter.post(
  '/:id/close',
  requirePermission('cash:write'),
  closeCashSession,
)
