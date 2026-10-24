import { describe, expect, it } from 'vitest'
import {
  formatPurchaseDate,
  getPurchaseErrorMessage,
  purchaseStatusClass,
  purchaseStatusLabel,
} from './purchase-formatters'

describe('purchase-formatters', () => {
  it('formatea etiquetas de estado correctamente', () => {
    expect(purchaseStatusLabel('DRAFT')).toBe('Borrador')
    expect(purchaseStatusLabel('RECEIVED')).toBe('Recibida')
    expect(purchaseStatusLabel('CANCELLED')).toBe('Cancelada')
  })

  it('proporciona clases CSS válidas según estado', () => {
    expect(purchaseStatusClass('DRAFT')).toContain('amber')
    expect(purchaseStatusClass('RECEIVED')).toContain('emerald')
    expect(purchaseStatusClass('CANCELLED')).toContain('red')
  })

  it('formatea fechas YYYY-MM-DD adecuadamente', () => {
    const formatted = formatPurchaseDate('2026-10-24')
    expect(formatted).toBeDefined()
    expect(formatted).toContain('2026')
  })

  it('extrae mensaje de error de respuesta axios', () => {
    const err = { response: { data: { message: 'Error de servidor' } } }
    expect(getPurchaseErrorMessage(err)).toBe('Error de servidor')

    const genericErr = new Error('Fallo de red')
    expect(getPurchaseErrorMessage(genericErr)).toBe('Fallo de red')

    expect(getPurchaseErrorMessage(null)).toBe(
      'Ocurrió un error inesperado. Intenta de nuevo.',
    )
  })
})
