import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  convertQuotationToOrder,
  createQuotation,
  getQuotation,
  listQuotations,
  updateQuotation,
} from './quotations.controller.js'

export const quotationsRouter = Router()

quotationsRouter.use(requireAuth)
quotationsRouter.get('/', requirePermission('sales:read'), listQuotations)
quotationsRouter.get('/:id', requirePermission('sales:read'), getQuotation)
quotationsRouter.post('/', requirePermission('sales:write'), createQuotation)
quotationsRouter.put('/:id', requirePermission('sales:write'), updateQuotation)
quotationsRouter.post(
  '/:id/convert-to-order',
  requirePermission('sales:write'),
  convertQuotationToOrder,
)
