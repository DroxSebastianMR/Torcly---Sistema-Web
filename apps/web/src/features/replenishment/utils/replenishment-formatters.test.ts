// @vitest-environment node

import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  countFormatter,
  defaultPeriod,
  formatCount,
  formatPeriodLabel,
  formatPriority,
  formatQuantity,
  formatReason,
  getReplenishmentErrorMessage,
} from './replenishment-formatters'

describe('Formatters de reabastecimiento (web)', () => {
  it('formatea cantidades con tres decimales', () => {
    expect(formatQuantity(60)).toBe('60')
    expect(formatQuantity(1.23456)).toBe('1.235')
    expect(formatQuantity(0)).toBe('0')
  })

  it('formatea conteos sin decimales', () => {
    expect(formatCount(1234)).toBe('1,234')
    expect(countFormatter.format(3)).toBe('3')
  })

  it('genera un período por defecto de 30 días en formato AAAA-MM-DD', () => {
    const period = defaultPeriod()
    expect(period.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(period.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const from = new Date(`${period.from}T00:00:00`)
    const to = new Date(`${period.to}T00:00:00`)
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(30)
  })

  it('etiqueta las prioridades en español y maneja valores vacíos', () => {
    expect(formatPriority('CRITICA')).toBe('Crítica')
    expect(formatPriority('ALTA')).toBe('Alta')
    expect(formatPriority('MEDIA')).toBe('Media')
    expect(formatPriority('BAJA')).toBe('Baja')
    expect(formatPriority(null)).toBe('—')
  })

  it('etiqueta las razones de no elegibilidad', () => {
    expect(formatReason('INACTIVE_PRODUCT')).toBe('Producto inactivo')
    expect(formatReason('INSUFFICIENT_DATA')).toBe('Datos insuficientes')
    expect(formatReason(null)).toBe('—')
  })

  it('formatea la etiqueta del período aplicado', () => {
    const label = formatPeriodLabel('2026-10-01', '2026-10-31')
    expect(label).toContain('oct')
    expect(label).toContain('2026')
    expect(label).toContain('—')
    expect(formatPeriodLabel(null, null)).toBe('Período seleccionado')
    expect(formatPeriodLabel('no-valida', '2026-10-31')).toBe(
      'Período seleccionado',
    )
  })

  it('extrae el mensaje de error de la API en respuestas de error', () => {
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        data: {
          error: { message: 'La corrida de reabastecimiento no existe.' },
        },
        status: 404,
        statusText: '',
        headers: {},
        config: { headers: undefined as never } as never,
      },
    )
    expect(getReplenishmentErrorMessage(error)).toBe(
      'La corrida de reabastecimiento no existe.',
    )
  })

  it('usa un mensaje genérico para errores no relacionados con la API', () => {
    expect(getReplenishmentErrorMessage(new Error('red'))).toBe(
      'No se pudo completar la operación.',
    )
  })
})
