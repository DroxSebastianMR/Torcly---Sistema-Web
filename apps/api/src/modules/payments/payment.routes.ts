import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  compensatePayment,
  createPayment,
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
  '/:paymentId/compensate',
  requirePermission('cash:write'),
  requirePermission('sales:write'),
  compensatePayment,
)
