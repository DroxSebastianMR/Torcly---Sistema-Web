import { describe, expect, it } from 'vitest'
import { AppError } from '../src/shared/errors/app-error.js'
import {
  assertCanRegisterMovement,
  computeStock,
  resolveAdjustmentType,
} from '../src/modules/inventory/inventory.rules.js'

describe('Reglas de inventario', () => {
  it('calcula el stock sumando entradas y restando salidas', () => {
    expect(
      computeStock([
        { type: 'INITIAL', quantity: 10 },
        { type: 'ENTRY', quantity: 5 },
        { type: 'EXIT', quantity: 3 },
        { type: 'ADJUSTMENT_IN', quantity: 2 },
        { type: 'ADJUSTMENT_OUT', quantity: 1 },
      ]),
    ).toBe(13)
    expect(computeStock([])).toBe(0)
  })

  it('resuelve el tipo del ajuste a partir del signo', () => {
    expect(resolveAdjustmentType(4)).toBe('ADJUSTMENT_IN')
    expect(resolveAdjustmentType(-4)).toBe('ADJUSTMENT_OUT')
  })

  it('permite registrar el stock inicial una sola vez', () => {
    expect(() =>
      assertCanRegisterMovement({
        type: 'INITIAL',
        quantity: 10,
        currentStock: 0,
        hasInitialMovement: false,
      }),
    ).not.toThrow()

    expect(() =>
      assertCanRegisterMovement({
        type: 'INITIAL',
        quantity: 10,
        currentStock: 10,
        hasInitialMovement: true,
      }),
    ).toThrowError(AppError)
  })

  it('rechaza salidas y ajustes que superan el saldo', () => {
    expect(() =>
      assertCanRegisterMovement({
        type: 'EXIT',
        quantity: 11,
        currentStock: 10,
        hasInitialMovement: true,
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'INSUFFICIENT_STOCK',
      }),
    )

    expect(() =>
      assertCanRegisterMovement({
        type: 'ADJUSTMENT_OUT',
        quantity: 3,
        currentStock: 2,
        hasInitialMovement: true,
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'INSUFFICIENT_STOCK',
      }),
    )
  })

  it('permite salidas exactas al saldo disponible', () => {
    expect(() =>
      assertCanRegisterMovement({
        type: 'EXIT',
        quantity: 10,
        currentStock: 10,
        hasInitialMovement: true,
      }),
    ).not.toThrow()
  })
})
