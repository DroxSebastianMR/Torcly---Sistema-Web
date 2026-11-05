import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import { requireOrganizationContext } from '../auth/organization-context.js'
import {
  cashSessionCloseSchema,
  cashSessionIdSchema,
  cashSessionOpenSchema,
  cashSessionQuerySchema,
} from './cash-session.schemas.js'
import { cashSessionsService } from './cash-session.service.js'

function actor(request: Request) {
  return { id: request.auth!.id, name: request.auth!.name }
}

function organizationId(request: Request) {
  return requireOrganizationContext(request.auth!).id
}

export const getCurrentCashSession: RequestHandler = async (
  request,
  response,
) => {
  response.json(await cashSessionsService.current(organizationId(request)))
}

export const listCashSessions: RequestHandler = async (request, response) => {
  response.json(
    await cashSessionsService.list(
      cashSessionQuerySchema.parse(request.query),
      organizationId(request),
    ),
  )
}

export const getCashSession: RequestHandler = async (request, response) => {
  const { id } = cashSessionIdSchema.parse(request.params)
  response.json(await cashSessionsService.getById(id, organizationId(request)))
}

export const openCashSession: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await cashSessionsService.open(
        cashSessionOpenSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
        organizationId(request),
      ),
    )
}

export const closeCashSession: RequestHandler = async (request, response) => {
  const { id } = cashSessionIdSchema.parse(request.params)
  response.json(
    await cashSessionsService.close(
      id,
      cashSessionCloseSchema.parse(request.body),
      actor(request),
      getRequestContext(request, response),
      organizationId(request),
    ),
  )
}
