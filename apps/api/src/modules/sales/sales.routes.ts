import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  confirmSale,
  createSale,
  getSale,
  getSaleCatalog,
  listSales,
  updateSale,
} from './sales.controller.js'

export const salesRouter = Router()

salesRouter.use(requireAuth)
salesRouter.get('/', requirePermission('sales:read'), listSales)
salesRouter.get('/catalogo', requirePermission('sales:read'), getSaleCatalog)
salesRouter.get('/:id', requirePermission('sales:read'), getSale)
salesRouter.post('/', requirePermission('sales:write'), createSale)
salesRouter.put('/:id', requirePermission('sales:write'), updateSale)
salesRouter.post('/:id/confirm', requirePermission('sales:write'), confirmSale)
