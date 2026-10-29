import type { RequestHandler } from 'express'
import {
  operationsAttentionQuerySchema,
  operationsSectionParamSchema,
  operationsSummaryQuerySchema,
} from './operations.schemas.js'
import { operationsService } from './operations.service.js'

export const getOperationsSummary: RequestHandler = async (
  request,
  response,
) => {
  const parsed = operationsSummaryQuerySchema.parse(request.query)
  response.json(
    await operationsService.getSummary(
      { from: parsed.from ?? null, to: parsed.to ?? null },
      request.auth?.permissions ?? [],
    ),
  )
}

export const getOperationsAttention: RequestHandler = async (
  request,
  response,
) => {
  const { section } = operationsSectionParamSchema.parse(request.params)
  const parsed = operationsAttentionQuerySchema.parse(request.query)
  response.json(
    await operationsService.getAttention(
      section,
      {
        from: parsed.from ?? null,
        to: parsed.to ?? null,
        page: parsed.page,
        pageSize: parsed.pageSize,
      },
      request.auth?.permissions ?? [],
    ),
  )
}
