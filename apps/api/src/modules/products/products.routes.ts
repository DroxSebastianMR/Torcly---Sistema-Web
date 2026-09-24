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

export const productsRouter = Router()

productsRouter.get('/', listProducts)
productsRouter.get('/options', getProductOptions)
productsRouter.post('/categories', createCategory)
productsRouter.post('/brands', createBrand)
productsRouter.post('/units', createUnit)
productsRouter.get('/:id', getProduct)
productsRouter.post('/', createProduct)
productsRouter.put('/:id', updateProduct)
productsRouter.patch('/:id/status', updateProductStatus)
