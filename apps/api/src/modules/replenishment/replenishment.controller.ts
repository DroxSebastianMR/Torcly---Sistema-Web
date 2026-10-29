import type { Request, RequestHandler } from 'express'
import { AppError } from '../../shared/errors/app-error.js'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  replenishmentEligibilityQuerySchema,
  replenishmentRunBodySchema,
  replenishmentRunDetailQuerySchema,
  replenishmentRunListQuerySchema,
  replenishmentRunParamSchema,
} from './replenishment.schemas.js'
import { replenishmentService } from './replenishment.service.js'

function actor(request: Request) {
  if (!request.auth)
    throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
  return { id: request.auth.id, name: request.auth.name }
}

export const getEligibility: RequestHandler = async (request, response) => {
  const parsed = replenishmentEligibilityQuerySchema.parse(request.query)
  response.json(
    await replenishmentService.getEligibility({
      from: parsed.from ?? null,
      to: parsed.to ?? null,
      coverageDays: parsed.coverageDays,
      search: parsed.search,
      priority: parsed.priority,
      eligible: parsed.eligible,
      page: parsed.page,
      pageSize: parsed.pageSize,
    }),
  )
}

export const createRun: RequestHandler = async (request, response) => {
  const parsed = replenishmentRunBodySchema.parse(request.body)
  const result = await replenishmentService.executeRun(
    {
      from: parsed.from ?? null,
      to: parsed.to ?? null,
      coverageDays: parsed.coverageDays,
      idempotencyKey: parsed.idempotencyKey,
    },
    actor(request),
    getRequestContext(request, response),
  )
  response.status(result.replayed ? 200 : 201).json(result.run)
}

export const listRuns: RequestHandler = async (request, response) => {
  const parsed = replenishmentRunListQuerySchema.parse(request.query)
  response.json(
    await replenishmentService.listRuns({
      from: parsed.from ?? null,
      to: parsed.to ?? null,
      page: parsed.page,
      pageSize: parsed.pageSize,
    }),
  )
}

export const getRunDetail: RequestHandler = async (request, response) => {
  const { code } = replenishmentRunParamSchema.parse(request.params)
  const parsed = replenishmentRunDetailQuerySchema.parse(request.query)
  response.json(
    await replenishmentService.getRunDetail(code, {
      search: parsed.search,
      priority: parsed.priority,
      eligible: parsed.eligible,
      page: parsed.page,
      pageSize: parsed.pageSize,
    }),
  )
}
