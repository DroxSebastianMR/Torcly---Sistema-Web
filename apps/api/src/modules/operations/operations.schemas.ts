import { z } from 'zod'
import { OPERATIONAL_SECTIONS } from './operations.types.js'

const dateFilter = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} debe tener formato AAAA-MM-DD.`)
    .optional()

export const operationsSummaryQuerySchema = z.object({
  from: dateFilter('La fecha inicial'),
  to: dateFilter('La fecha final'),
})

export const operationsAttentionQuerySchema = z.object({
  from: dateFilter('La fecha inicial'),
  to: dateFilter('La fecha final'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const operationsSectionParamSchema = z.object({
  section: z.enum(OPERATIONAL_SECTIONS, {
    error: 'La sección operativa no es válida.',
  }),
})

export type OperationsSummaryQueryDto = z.infer<
  typeof operationsSummaryQuerySchema
>
export type OperationsAttentionQueryDto = z.infer<
  typeof operationsAttentionQuerySchema
>
export type OperationsSectionParamDto = z.infer<
  typeof operationsSectionParamSchema
>
