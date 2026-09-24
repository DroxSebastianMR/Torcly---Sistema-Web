import { Router } from 'express'
import {
  createBrand,
  createCategory,
  createProduct,
  createUnit,
  getProduct,
  getProductOptions,
  listProducts,
  updateProduct,
  updateProductStatus,
} from './products.controller.js'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'

export const productsRouter = Router()

productsRouter.use(requireAuth)
productsRouter.get('/', requirePermission('products:read'), listProducts)
productsRouter.get(
  '/options',
  requirePermission('products:read'),
  getProductOptions,
)
productsRouter.post(
  '/categories',
  requirePermission('products:write'),
  createCategory,
)
productsRouter.post('/brands', requirePermission('products:write'), createBrand)
productsRouter.post('/units', requirePermission('products:write'), createUnit)
productsRouter.get('/:id', requirePermission('products:read'), getProduct)
productsRouter.post('/', requirePermission('products:write'), createProduct)
productsRouter.put('/:id', requirePermission('products:write'), updateProduct)
productsRouter.patch(
  '/:id/status',
  requirePermission('products:write'),
  updateProductStatus,
)
