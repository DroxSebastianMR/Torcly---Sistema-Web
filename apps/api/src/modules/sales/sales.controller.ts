import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import { requireOrganizationContext } from '../auth/organization-context.js'
import {
  saleCancelSchema,
  saleCreateSchema,
  saleIdSchema,
  saleQuerySchema,
  saleUpdateSchema,
} from './sales.schemas.js'
import { salesService } from './sales.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

function organizationId(request: Request) {
  return requireOrganizationContext(request.auth!).id
}

export const listSales: RequestHandler = async (request, response) => {
  response.json(
    await salesService.list(
      saleQuerySchema.parse(request.query),
      organizationId(request),
    ),
  )
}

export const getSale: RequestHandler = async (request, response) => {
  const { id } = saleIdSchema.parse(request.params)
  response.json(await salesService.getById(id, organizationId(request)))
}

export const getSaleCatalog: RequestHandler = async (request, response) => {
  response.json(await salesService.getCatalog(organizationId(request)))
}

export const createSale: RequestHandler = async (request, response) => {
  const { confirm, ...input } = saleCreateSchema.parse(request.body)
  response
    .status(201)
    .json(
      await salesService.create(
        input,
        actor(request),
        getRequestContext(request, response),
        organizationId(request),
        confirm,
      ),
    )
}

export const cancelSale: RequestHandler = async (request, response) => {
  const { id } = saleIdSchema.parse(request.params)
  response.json(
    await salesService.cancel(
      id,
      saleCancelSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const updateSale: RequestHandler = async (request, response) => {
  const { id } = saleIdSchema.parse(request.params)
  response.json(
    await salesService.update(
      id,
      saleUpdateSchema.parse(request.body),
      actor(request).id,
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const confirmSale: RequestHandler = async (request, response) => {
  const { id } = saleIdSchema.parse(request.params)
  response.json(
    await salesService.confirm(
      id,
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}
