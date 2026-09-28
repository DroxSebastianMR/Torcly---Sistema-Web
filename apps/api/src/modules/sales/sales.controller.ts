import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  saleIdSchema,
  saleInputSchema,
  saleQuerySchema,
  saleUpdateSchema,
} from './sales.schemas.js'
import { salesService } from './sales.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

export const listSales: RequestHandler = async (request, response) => {
  response.json(await salesService.list(saleQuerySchema.parse(request.query)))
}

export const getSale: RequestHandler = async (request, response) => {
  const { id } = saleIdSchema.parse(request.params)
  response.json(await salesService.getById(id))
}

export const getSaleCatalog: RequestHandler = async (_request, response) => {
  response.json(await salesService.getCatalog())
}

export const createSale: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await salesService.create(
        saleInputSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
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
    ),
  )
}
