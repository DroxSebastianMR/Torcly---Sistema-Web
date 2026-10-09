import { describe, expect, it } from 'vitest'
import {
  reportsBlockParamSchema,
  reportsBlockQuerySchema,
  reportsSummaryQuerySchema,
} from '../src/modules/reports/reports.schemas.js'

describe('Esquemas de reportes', () => {
  it('acepta períodos opcionales bien formados', () => {
    expect(reportsSummaryQuerySchema.parse({})).toEqual({})
    expect(
      reportsSummaryQuerySchema.parse({ from: '2026-10-01', to: '2026-10-31' }),
    ).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(reportsBlockQuerySchema.parse({ from: '2026-10-01' })).toEqual({
      from: '2026-10-01',
    })
  })

  it('rechaza fechas con otro formato', () => {
    for (const value of ['2026/10/01', '01-10-2026', '20261001', '2026-1-1']) {
      const result = reportsSummaryQuerySchema.safeParse({ from: value })
      expect(result.success).toBe(false)
    }
  })

  it('valida el bloque por parámetro de ruta', () => {
    expect(reportsBlockParamSchema.parse({ block: 'payments' }).block).toBe(
      'payments',
    )
    expect(
      reportsBlockParamSchema.safeParse({ block: 'unknown' }).success,
    ).toBe(false)
  })
})
