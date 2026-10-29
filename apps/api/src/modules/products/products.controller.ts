import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  catalogIdSchema,
  catalogItemSchema,
  catalogUpdateSchema,
  productIdSchema,
  productInputSchema,
  productQuerySchema,
  productStatusSchema,
  productUpdateSchema,
  unitInputSchema,
  unitUpdateSchema,
} from './products.schemas.js'
import { productsService } from './products.service.js'

export const listProducts: RequestHandler = async (request, response) => {
  response.json(
    await productsService.list(productQuerySchema.parse(request.query)),
  )
}

export const getProduct: RequestHandler = async (request, response) => {
  const { id } = productIdSchema.parse(request.params)
  response.json(await productsService.getById(id))
}

export const createProduct: RequestHandler = async (request, response) => {
  const result = await productsService.create(
    productInputSchema.parse(request.body),
    request.auth!.id,
    getRequestContext(request, response),
  )
  response.status(201).json(result)
}

export const updateProduct: RequestHandler = async (request, response) => {
  const { id } = productIdSchema.parse(request.params)
  response.json(
    await productsService.update(
      id,
      productUpdateSchema.parse(request.body),
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}

export const updateProductStatus: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(
    await productsService.updateStatus(
      id,
      active,
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}

export const getProductOptions: RequestHandler = async (_request, response) => {
  response.json(await productsService.getOptions())
}

export const getCatalog: RequestHandler = async (_request, response) => {
  response.json(await productsService.getCatalog())
}

export const createCategory: RequestHandler = async (request, response) => {
  const { name } = catalogItemSchema.parse(request.body)
  response.status(201).json(await productsService.createCategory(name))
}

export const createBrand: RequestHandler = async (request, response) => {
  const { name } = catalogItemSchema.parse(request.body)
  response.status(201).json(await productsService.createBrand(name))
}

export const createUnit: RequestHandler = async (request, response) => {
  const { name, symbol } = unitInputSchema.parse(request.body)
  response.status(201).json(await productsService.createUnit(name, symbol))
}

export const updateCategory: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { name } = catalogUpdateSchema.parse(request.body)
  response.json(await productsService.updateCategory(id, name))
}

export const updateBrand: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { name } = catalogUpdateSchema.parse(request.body)
  response.json(await productsService.updateBrand(id, name))
}

export const updateUnit: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { name, symbol } = unitUpdateSchema.parse(request.body)
  response.json(await productsService.updateUnit(id, name, symbol))
}

export const updateCategoryStatus: RequestHandler = async (
  request,
  response,
) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(await productsService.updateCategoryStatus(id, active))
}

export const updateBrandStatus: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(await productsService.updateBrandStatus(id, active))
}

export const updateUnitStatus: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(await productsService.updateUnitStatus(id, active))
}
