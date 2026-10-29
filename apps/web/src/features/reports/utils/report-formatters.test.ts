import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  formatHours,
  formatPeriodLabel,
  formatQuantity,
  isForbidden,
} from './report-formatters'

function httpError(status: number): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      data: undefined,
      status,
      statusText: '',
      headers: {},
      config: { headers: undefined as never } as never,
    },
  )
}

describe('Formateadores de reportes', () => {
  it('formatea importes como soles', () => {
    expect(formatAmount(0)).toMatch(/0[.,]00/)
    expect(formatAmount(1234.5)).toContain('S/')
    expect(formatAmount(1234.5)).toMatch(/234/)
  })

  it('formatea cantidades con hasta tres decimales', () => {
    expect(formatQuantity(2)).toBe('2')
    expect(formatQuantity(1.25)).toMatch(/1[.,]25/)
    expect(formatQuantity(0.5)).toMatch(/0[.,]5/)
  })

  it('formatea horas promedio y el vacío', () => {
    expect(formatHours(24.5)).toMatch(/24[.,]5 h/)
    expect(formatHours(null)).toBe('Sin datos')
  })

  it('formatea el período aplicado', () => {
    expect(formatPeriodLabel('2026-10-01', '2026-10-31')).toContain('2026')
  })

  it('detecta errores de autorización 403', () => {
    expect(isForbidden(httpError(403))).toBe(true)
    expect(isForbidden(httpError(500))).toBe(false)
    expect(isForbidden(new Error('red'))).toBe(false)
  })
})
