import { z } from 'zod'

export const REPLENISHMENT_COVERAGE_MIN = 1
export const REPLENISHMENT_COVERAGE_MAX = 365

export const runFormSchema = z.object({
  coverageDays: z.coerce
    .number<number>()
    .int('La cobertura debe ser un número de días entero.')
    .min(
      REPLENISHMENT_COVERAGE_MIN,
      `La cobertura debe estar entre ${REPLENISHMENT_COVERAGE_MIN} y ${REPLENISHMENT_COVERAGE_MAX} días.`,
    )
    .max(
      REPLENISHMENT_COVERAGE_MAX,
      `La cobertura debe estar entre ${REPLENISHMENT_COVERAGE_MIN} y ${REPLENISHMENT_COVERAGE_MAX} días.`,
    ),
})

export type RunFormValues = z.input<typeof runFormSchema>
