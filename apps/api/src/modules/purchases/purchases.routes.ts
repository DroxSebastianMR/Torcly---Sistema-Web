import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  cancelPurchase,
  confirmPurchase,
  createPurchase,
  createSupplier,
  getPurchase,
  getSupplier,
  listActiveSuppliers,
  listPurchases,
  listSuppliers,
  updatePurchase,
  updateSupplier,
  updateSupplierStatus,
} from './purchases.controller.js'

export const purchasesRouter = Router()

purchasesRouter.use(requireAuth)

// Suppliers
purchasesRouter.get(
  '/suppliers',
  requirePermission('purchases:read'),
  listSuppliers,
)
purchasesRouter.get(
  '/suppliers/activos',
  requirePermission('purchases:read'),
  listActiveSuppliers,
)
purchasesRouter.get(
  '/suppliers/:id',
  requirePermission('purchases:read'),
  getSupplier,
)
purchasesRouter.post(
  '/suppliers',
  requirePermission('purchases:write'),
  createSupplier,
)
purchasesRouter.put(
  '/suppliers/:id',
  requirePermission('purchases:write'),
  updateSupplier,
)
purchasesRouter.patch(
  '/suppliers/:id/status',
  requirePermission('purchases:write'),
  updateSupplierStatus,
)

// Purchases
purchasesRouter.get('/', requirePermission('purchases:read'), listPurchases)
purchasesRouter.get('/:id', requirePermission('purchases:read'), getPurchase)
purchasesRouter.post('/', requirePermission('purchases:write'), createPurchase)
purchasesRouter.put(
  '/:id',
  requirePermission('purchases:write'),
  updatePurchase,
)
purchasesRouter.post(
  '/:id/receive',
  requirePermission('purchases:write'),
  confirmPurchase,
)
purchasesRouter.post(
  '/:id/cancel',
  requirePermission('purchases:write'),
  cancelPurchase,
)
