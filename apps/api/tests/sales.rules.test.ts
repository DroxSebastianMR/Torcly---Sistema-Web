import { describe, expect, it } from 'vitest'
import {
  aggregateProductQuantities,
  assertHasLines,
  computeSaleTotals,
  roundMoney,
} from '../src/modules/sales/sales.rules.js'

describe('Reglas de ventas', () => {
  it('redondea montos a dos decimales', () => {
    expect(roundMoney(10.005)).toBe(10.01)
    expect(roundMoney(3.14159)).toBe(3.14)
    expect(roundMoney(12.345)).toBe(12.35)
  })

  it('suma subtotales por línea sin descuentos', () => {
    const totals = computeSaleTotals([
      { unitPrice: 35.5, quantity: 2 },
      { unitPrice: 12.5, quantity: 1 },
    ])
    expect(totals).toEqual({ subtotal: 83.5, total: 83.5 })
  })

  it('redondea el subtotal acumulado correctamente', () => {
    const totals = computeSaleTotals([
      { unitPrice: 0.1, quantity: 3 },
      { unitPrice: 0.2, quantity: 1 },
    ])
    expect(totals.subtotal).toBe(0.5)
  })

  it('exige al menos una línea en la venta', () => {
    expect(() => assertHasLines([])).toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'SALE_NO_LINES',
      }),
    )
    expect(() => assertHasLines([{ type: 'PRODUCT' }])).not.toThrow()
  })

  it('agrega las cantidades de productos repetidos al confirmar', () => {
    const quantities = aggregateProductQuantities([
      { type: 'PRODUCT', productId: 'p1', quantity: 2 },
      { type: 'PRODUCT', productId: 'p1', quantity: 3 },
      { type: 'SERVICE', productId: null, quantity: 1 },
      { type: 'PRODUCT', productId: 'p2', quantity: 1 },
    ])
    expect(quantities.get('p1')).toBe(5)
    expect(quantities.get('p2')).toBe(1)
    expect(quantities.size).toBe(2)
  })
})
