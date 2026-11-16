import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import { requireOrganizationContext } from '../auth/organization-context.js'
import {
  quotationCreateSchema,
  quotationConversionSchema,
  quotationIdSchema,
  quotationQuerySchema,
  quotationUpdateSchema,
} from './quotations.schemas.js'
import { quotationsService } from './quotations.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

function organizationId(request: Request) {
  return requireOrganizationContext(request.auth!).id
}

export const listQuotations: RequestHandler = async (request, response) => {
  response.json(
    await quotationsService.list(
      quotationQuerySchema.parse(request.query),
      organizationId(request),
    ),
  )
}

export const getQuotation: RequestHandler = async (request, response) => {
  const { id } = quotationIdSchema.parse(request.params)
  response.json(await quotationsService.getById(id, organizationId(request)))
}

export const createQuotation: RequestHandler = async (request, response) => {
  const input = quotationCreateSchema.parse(request.body)
  response
    .status(201)
    .json(
      await quotationsService.create(
        input,
        actor(request),
        getRequestContext(request, response),
        organizationId(request),
      ),
    )
}

export const updateQuotation: RequestHandler = async (request, response) => {
  const { id } = quotationIdSchema.parse(request.params)
  const input = quotationUpdateSchema.parse(request.body)
  response.json(
    await quotationsService.update(
      id,
      input,
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}

export const convertQuotationToOrder: RequestHandler = async (
  request,
  response,
) => {
  const { id } = quotationIdSchema.parse(request.params)
  const input = quotationConversionSchema.parse(request.body)
  response.json(
    await quotationsService.convertToOrder(
      id,
      input,
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}
