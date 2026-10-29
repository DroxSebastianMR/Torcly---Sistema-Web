import { Router } from 'express'
import {
  createBrand,
  createCategory,
  createProduct,
  createUnit,
  getCatalog,
  getProduct,
  getProductOptions,
  listProducts,
  updateProduct,
  updateProductStatus,
  updateBrand,
  updateBrandStatus,
  updateCategory,
  updateCategoryStatus,
  updateUnit,
  updateUnitStatus,
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
productsRouter.get('/catalog', requirePermission('products:write'), getCatalog)
productsRouter.post(
  '/categories',
  requirePermission('products:write'),
  createCategory,
)
productsRouter.post('/brands', requirePermission('products:write'), createBrand)
productsRouter.post('/units', requirePermission('products:write'), createUnit)
productsRouter.put(
  '/categories/:id',
  requirePermission('products:write'),
  updateCategory,
)
productsRouter.patch(
  '/categories/:id/status',
  requirePermission('products:write'),
  updateCategoryStatus,
)
productsRouter.put(
  '/brands/:id',
  requirePermission('products:write'),
  updateBrand,
)
productsRouter.patch(
  '/brands/:id/status',
  requirePermission('products:write'),
  updateBrandStatus,
)
productsRouter.put(
  '/units/:id',
  requirePermission('products:write'),
  updateUnit,
)
productsRouter.patch(
  '/units/:id/status',
  requirePermission('products:write'),
  updateUnitStatus,
)
productsRouter.get('/:id', requirePermission('products:read'), getProduct)
productsRouter.post('/', requirePermission('products:write'), createProduct)
productsRouter.put('/:id', requirePermission('products:write'), updateProduct)
productsRouter.patch(
  '/:id/status',
  requirePermission('products:write'),
  updateProductStatus,
)
