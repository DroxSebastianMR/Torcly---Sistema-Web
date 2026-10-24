import { describe, expect, it } from 'vitest'
import {
  assertCanCancelPurchase,
  assertCanConfirmPurchase,
  assertCanEditPurchase,
  assertHasPurchaseLines,
  computePurchaseTotal,
} from '../src/modules/purchases/purchases.rules.js'

describe('assertCanEditPurchase', () => {
  it('permite editar en DRAFT', () => {
    expect(() => assertCanEditPurchase('DRAFT')).not.toThrow()
  })

  it('rechaza editar en RECEIVED', () => {
    expect(() => assertCanEditPurchase('RECEIVED')).toThrow(/borrador/)
  })

  it('rechaza editar en CANCELLED', () => {
    expect(() => assertCanEditPurchase('CANCELLED')).toThrow(/borrador/)
  })
})

describe('assertCanConfirmPurchase', () => {
  it('permite confirmar en DRAFT', () => {
    expect(() => assertCanConfirmPurchase('DRAFT')).not.toThrow()
  })

  it('rechaza doble confirmación', () => {
    expect(() => assertCanConfirmPurchase('RECEIVED')).toThrow(/recibida/)
  })

  it('rechaza confirmar cancelada', () => {
    expect(() => assertCanConfirmPurchase('CANCELLED')).toThrow(/cancelada/)
  })
})

describe('assertCanCancelPurchase', () => {
  it('permite cancelar en DRAFT', () => {
    expect(() => assertCanCancelPurchase('DRAFT')).not.toThrow()
  })

  it('rechaza cancelar una recibida', () => {
    expect(() => assertCanCancelPurchase('RECEIVED')).toThrow(/recibida/)
  })

  it('rechaza cancelar ya cancelada', () => {
    expect(() => assertCanCancelPurchase('CANCELLED')).toThrow(/cancelada/)
  })
})

describe('computePurchaseTotal', () => {
  it('calcula total correcto', () => {
    const total = computePurchaseTotal([
      { quantity: 5, unitCost: 10 },
      { quantity: 3, unitCost: 7.5 },
    ])
    expect(total).toBe(72.5)
  })

  it('redondea a 2 decimales', () => {
    const total = computePurchaseTotal([{ quantity: 1.001, unitCost: 3.33 }])
    expect(total).toBeCloseTo(3.33, 2)
  })

  it('devuelve 0 para líneas vacías', () => {
    expect(computePurchaseTotal([])).toBe(0)
  })
})

describe('assertHasPurchaseLines', () => {
  it('no lanza con líneas', () => {
    expect(() => assertHasPurchaseLines([{}])).not.toThrow()
  })

  it('lanza con lista vacía', () => {
    expect(() => assertHasPurchaseLines([])).toThrow(/al menos un producto/)
  })
})
