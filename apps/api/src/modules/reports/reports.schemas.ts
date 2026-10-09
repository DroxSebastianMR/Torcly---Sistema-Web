import { z } from 'zod'
import { REPORT_BLOCKS } from './reports.types.js'

const dateFilter = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} debe tener formato AAAA-MM-DD.`)
    .optional()

export const reportsSummaryQuerySchema = z.object({
  from: dateFilter('La fecha inicial'),
  to: dateFilter('La fecha final'),
})

export const reportsBlockQuerySchema = z.object({
  from: dateFilter('La fecha inicial'),
  to: dateFilter('La fecha final'),
})

export const reportsBlockParamSchema = z.object({
  block: z.enum(REPORT_BLOCKS, {
    error: 'El bloque de reporte no es válido.',
  }),
})

export type ReportsSummaryQueryDto = z.infer<typeof reportsSummaryQuerySchema>
export type ReportsBlockQueryDto = z.infer<typeof reportsBlockQuerySchema>
export type ReportsBlockParamDto = z.infer<typeof reportsBlockParamSchema>
