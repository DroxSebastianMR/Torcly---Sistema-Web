import { z } from 'zod'
import {
  REPLENISHMENT_DEFAULT_COVERAGE_DAYS,
  REPLENISHMENT_MAX_COVERAGE_DAYS,
  REPLENISHMENT_MIN_COVERAGE_DAYS,
  REPLENISHMENT_PRIORITIES,
} from './replenishment.types.js'

const dateFilter = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} debe tener formato AAAA-MM-DD.`)
    .optional()

const basePagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
}

const coverageDays = z.coerce
  .number()
  .int('La cobertura debe ser un número de días entero.')
  .min(
    REPLENISHMENT_MIN_COVERAGE_DAYS,
    `La cobertura mínima es de ${REPLENISHMENT_MIN_COVERAGE_DAYS} día.`,
  )
  .max(
    REPLENISHMENT_MAX_COVERAGE_DAYS,
    `La cobertura máxima es de ${REPLENISHMENT_MAX_COVERAGE_DAYS} días.`,
  )
  .default(REPLENISHMENT_DEFAULT_COVERAGE_DAYS)

const priorityFilter = z
  .enum(REPLENISHMENT_PRIORITIES, {
    error: 'La prioridad no es válida.',
  })
  .optional()
  .nullable()
  .transform((value) => value ?? null)

const eligibleFilter = z
  .enum(['true', 'false'], {
    error: 'El filtro de elegibilidad debe ser true o false.',
  })
  .optional()
  .transform((value) => (value === undefined ? null : value === 'true'))

const searchFilter = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || null)

export const replenishmentEligibilityQuerySchema = z.object({
  from: dateFilter('La fecha inicial'),
  to: dateFilter('La fecha final'),
  coverageDays,
  search: searchFilter,
  priority: priorityFilter,
  eligible: eligibleFilter,
  ...basePagination,
})

export const replenishmentRunBodySchema = z
  .object({
    from: dateFilter('La fecha inicial'),
    to: dateFilter('La fecha final'),
    coverageDays,
    idempotencyKey: z
      .string()
      .trim()
      .min(8, 'La clave de idempotencia debe tener al menos 8 caracteres.')
      .max(100, 'La clave de idempotencia supera el límite de 100 caracteres.')
      .optional()
      .transform((value) => value ?? null),
  })
  .strict()

export const replenishmentRunListQuerySchema = z.object({
  from: dateFilter('La fecha inicial'),
  to: dateFilter('La fecha final'),
  ...basePagination,
})

export const replenishmentRunDetailQuerySchema = z.object({
  search: searchFilter,
  priority: priorityFilter,
  eligible: eligibleFilter,
  ...basePagination,
})

export const replenishmentRunParamSchema = z.object({
  code: z.string().regex(/^RAB-\d{6}$/, 'El código de corrida no es válido.'),
})

export type ReplenishmentEligibilityQueryDto = z.infer<
  typeof replenishmentEligibilityQuerySchema
>
export type ReplenishmentRunBodyDto = z.infer<typeof replenishmentRunBodySchema>
export type ReplenishmentRunListQueryDto = z.infer<
  typeof replenishmentRunListQuerySchema
>
export type ReplenishmentRunDetailQueryDto = z.infer<
  typeof replenishmentRunDetailQuerySchema
>
export type ReplenishmentRunParamDto = z.infer<
  typeof replenishmentRunParamSchema
>
