import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  compensatePayment,
  createPayment,
  createSplitPayment,
  getPayment,
  listPayments,
} from './payment.controller.js'

export const paymentsRouter = Router()

paymentsRouter.use(requireAuth)
paymentsRouter.get(
  '/',
  requirePermission('cash:read'),
  requirePermission('sales:read'),
  listPayments,
)
paymentsRouter.get(
  '/:id',
  requirePermission('cash:read'),
  requirePermission('sales:read'),
  getPayment,
)
paymentsRouter.post(
  '/:id/pay',
  requirePermission('cash:write'),
  requirePermission('sales:write'),
  createPayment,
)
paymentsRouter.post(
  '/:id/pay-split',
  requirePermission('cash:write'),
  requirePermission('sales:write'),
  createSplitPayment,
)
paymentsRouter.post(
  '/:paymentId/compensate',
  requirePermission('cash:write'),
  requirePermission('sales:write'),
  compensatePayment,
)
