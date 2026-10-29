// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  runFormSchema,
  REPLENISHMENT_COVERAGE_MAX,
  REPLENISHMENT_COVERAGE_MIN,
} from './run.schema'

describe('Esquema del formulario de corrida de reabastecimiento', () => {
  it('acepta una cobertura válida dentro del rango', () => {
    expect(runFormSchema.parse({ coverageDays: 30 }).coverageDays).toBe(30)
    expect(
      runFormSchema.parse({ coverageDays: REPLENISHMENT_COVERAGE_MIN })
        .coverageDays,
    ).toBe(REPLENISHMENT_COVERAGE_MIN)
    expect(
      runFormSchema.parse({ coverageDays: REPLENISHMENT_COVERAGE_MAX })
        .coverageDays,
    ).toBe(REPLENISHMENT_COVERAGE_MAX)
  })

  it('convierte la cobertura escrita como texto a número', () => {
    expect(runFormSchema.parse({ coverageDays: '45' }).coverageDays).toBe(45)
  })

  it('rechaza coberturas fuera del rango', () => {
    expect(runFormSchema.safeParse({ coverageDays: 0 }).success).toBe(false)
    expect(
      runFormSchema.safeParse({ coverageDays: REPLENISHMENT_COVERAGE_MAX + 1 })
        .success,
    ).toBe(false)
  })

  it('rechaza coberturas fraccionarias', () => {
    expect(runFormSchema.safeParse({ coverageDays: 12.5 }).success).toBe(false)
  })

  it('rechaza valores no numéricos', () => {
    expect(runFormSchema.safeParse({ coverageDays: 'abc' }).success).toBe(false)
    expect(runFormSchema.safeParse({ coverageDays: undefined }).success).toBe(
      false,
    )
  })
})
