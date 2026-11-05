import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import { requireOrganizationContext } from '../auth/organization-context.js'
import {
  catalogIdSchema,
  catalogItemSchema,
  catalogUpdateSchema,
  productCodeAvailabilitySchema,
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
    await productsService.list(
      productQuerySchema.parse(request.query),
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const getProduct: RequestHandler = async (request, response) => {
  const { id } = productIdSchema.parse(request.params)
  response.json(
    await productsService.getById(
      id,
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const checkProductCodeAvailability: RequestHandler = async (
  request,
  response,
) => {
  const { code, excludeId } = productCodeAvailabilitySchema.parse(request.query)
  response.json(
    await productsService.checkCodeAvailability(
      code,
      requireOrganizationContext(request.auth).id,
      excludeId,
    ),
  )
}

export const createProduct: RequestHandler = async (request, response) => {
  const result = await productsService.create(
    productInputSchema.parse(request.body),
    request.auth!.id,
    requireOrganizationContext(request.auth).id,
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
      requireOrganizationContext(request.auth).id,
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
      requireOrganizationContext(request.auth).id,
      getRequestContext(request, response),
    ),
  )
}

export const getProductOptions: RequestHandler = async (request, response) => {
  response.json(
    await productsService.getOptions(
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const getCatalog: RequestHandler = async (request, response) => {
  response.json(
    await productsService.getCatalog(
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const createCategory: RequestHandler = async (request, response) => {
  const { name } = catalogItemSchema.parse(request.body)
  response
    .status(201)
    .json(
      await productsService.createCategory(
        name,
        requireOrganizationContext(request.auth).id,
      ),
    )
}

export const createBrand: RequestHandler = async (request, response) => {
  const { name } = catalogItemSchema.parse(request.body)
  response
    .status(201)
    .json(
      await productsService.createBrand(
        name,
        requireOrganizationContext(request.auth).id,
      ),
    )
}

export const createUnit: RequestHandler = async (request, response) => {
  const { name, symbol } = unitInputSchema.parse(request.body)
  response
    .status(201)
    .json(
      await productsService.createUnit(
        name,
        symbol,
        requireOrganizationContext(request.auth).id,
      ),
    )
}

export const updateCategory: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { name } = catalogUpdateSchema.parse(request.body)
  response.json(
    await productsService.updateCategory(
      id,
      name,
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const updateBrand: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { name } = catalogUpdateSchema.parse(request.body)
  response.json(
    await productsService.updateBrand(
      id,
      name,
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const updateUnit: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { name, symbol } = unitUpdateSchema.parse(request.body)
  response.json(
    await productsService.updateUnit(
      id,
      name,
      symbol,
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const updateCategoryStatus: RequestHandler = async (
  request,
  response,
) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(
    await productsService.updateCategoryStatus(
      id,
      active,
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const updateBrandStatus: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(
    await productsService.updateBrandStatus(
      id,
      active,
      requireOrganizationContext(request.auth).id,
    ),
  )
}

export const updateUnitStatus: RequestHandler = async (request, response) => {
  const { id } = catalogIdSchema.parse(request.params)
  const { active } = productStatusSchema.parse(request.body)
  response.json(
    await productsService.updateUnitStatus(
      id,
      active,
      requireOrganizationContext(request.auth).id,
    ),
  )
}
