import type { Request, RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
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

export const getCurrentCashSession: RequestHandler = async (
  _request,
  response,
) => {
  response.json(await cashSessionsService.current())
}

export const listCashSessions: RequestHandler = async (request, response) => {
  response.json(
    await cashSessionsService.list(cashSessionQuerySchema.parse(request.query)),
  )
}

export const getCashSession: RequestHandler = async (request, response) => {
  const { id } = cashSessionIdSchema.parse(request.params)
  response.json(await cashSessionsService.getById(id))
}

export const openCashSession: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await cashSessionsService.open(
        cashSessionOpenSchema.parse(request.body),
        actor(request),
        getRequestContext(request, response),
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
    ),
  )
}
