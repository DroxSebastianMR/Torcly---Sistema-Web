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

export const exportReports: RequestHandler = async (request, response) => {
  const parsed = reportsSummaryQuerySchema.parse(request.query)
  const { file, period } = await reportsService.exportWorkbook(
    { from: parsed.from ?? null, to: parsed.to ?? null },
    request.auth?.permissions ?? [],
  )
  const filename = `torcly-reportes-${period.from}-${period.to}.xlsx`
  response
    .status(200)
    .setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    .setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    .setHeader('Cache-Control', 'no-store')
    .send(file)
}
