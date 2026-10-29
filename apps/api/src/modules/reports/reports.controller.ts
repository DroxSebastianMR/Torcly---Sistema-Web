import type { RequestHandler } from 'express'
import {
  reportsBlockParamSchema,
  reportsBlockQuerySchema,
  reportsSummaryQuerySchema,
} from './reports.schemas.js'
import { reportsService } from './reports.service.js'

export const getReportsSummary: RequestHandler = async (request, response) => {
  const parsed = reportsSummaryQuerySchema.parse(request.query)
  response.json(
    await reportsService.getSummary(
      { from: parsed.from ?? null, to: parsed.to ?? null },
      request.auth?.permissions ?? [],
    ),
  )
}

export const getReportBlock: RequestHandler = async (request, response) => {
  const { block } = reportsBlockParamSchema.parse(request.params)
  const parsed = reportsBlockQuerySchema.parse(request.query)
  response.json(
    await reportsService.getBlock(
      block,
      { from: parsed.from ?? null, to: parsed.to ?? null },
      request.auth?.permissions ?? [],
    ),
  )
}
