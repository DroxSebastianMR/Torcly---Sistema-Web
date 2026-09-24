import type { RequestHandler } from 'express'
import {
  catalogItemSchema,
  productIdSchema,
  productInputSchema,
  productQuerySchema,
  productStatusSchema,
  unitInputSchema,
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
  )
  response.status(201).json(result)
}

export const updateProduct: RequestHandler = async (request, response) => {
  const { id } = productIdSchema.parse(request.params)
  response.json(
    await productsService.update(id, productInputSchema.parse(request.body)),
  )
}

export const updateProductStatus: RequestHandler = async (
  request,
  response,
) => {
  const { id } = productIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(await productsService.updateStatus(id, active))
}

export const getProductOptions: RequestHandler = async (_request, response) => {
  response.json(await productsService.getOptions())
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
