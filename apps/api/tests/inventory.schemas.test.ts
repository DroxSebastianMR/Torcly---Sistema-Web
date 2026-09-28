import { describe, expect, it } from 'vitest'
import {
  adjustmentSchema,
  entrySchema,
  existenceQuerySchema,
  exitSchema,
  initialStockSchema,
  movementQuerySchema,
} from '../src/modules/inventory/inventory.schemas.js'

const validMovement = {
  productId: '3da6aac9-6b4f-4698-95e4-7ca4520c4563',
  quantity: 10,
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  notes: 'Inventario inicial',
}

describe('Validación de movimientos de inventario', () => {
  it('acepta un payload válido para stock inicial, entrada y salida', () => {
    for (const schema of [initialStockSchema, entrySchema, exitSchema]) {
      expect(schema.safeParse(validMovement).success).toBe(true)
    }
    const parsed = entrySchema.parse(validMovement)
    expect(parsed.quantity).toBe(10)
  })

  it('rechaza cantidades cero, negativas y no numéricas', () => {
    expect(
      exitSchema.safeParse({ ...validMovement, quantity: 0 }).success,
    ).toBe(false)
    expect(
      entrySchema.safeParse({ ...validMovement, quantity: -3 }).success,
    ).toBe(false)
    expect(
      initialStockSchema.safeParse({ ...validMovement, quantity: 'abc' })
        .success,
    ).toBe(false)
    expect(
      initialStockSchema.safeParse({ ...validMovement, quantity: NaN }).success,
    ).toBe(false)
  })

  it('exige una clave de idempotencia con longitud mínima', () => {
    expect(
      entrySchema.safeParse({ ...validMovement, idempotencyKey: '' }).success,
    ).toBe(false)
    expect(
      entrySchema.safeParse({
        ...validMovement,
        idempotencyKey: '  short  ',
      }).success,
    ).toBe(false)
  })

  it('permite cantidades firmadas en el ajuste y rechaza cero', () => {
    const positive = adjustmentSchema.parse({
      ...validMovement,
      quantity: 6,
    })
    expect(positive.quantity).toBe(6)

    const negative = adjustmentSchema.parse({
      ...validMovement,
      quantity: -4,
    })
    expect(negative.quantity).toBe(-4)

    expect(
      adjustmentSchema.safeParse({ ...validMovement, quantity: 0 }).success,
    ).toBe(false)
  })

  it('rechaza movimientos sin producto y con claves desconocidas', () => {
    const withoutProduct = { ...validMovement }
    Reflect.deleteProperty(withoutProduct, 'productId')
    expect(exitSchema.safeParse(withoutProduct).success).toBe(false)
    expect(
      exitSchema.safeParse({ ...validMovement, stockAfter: 5 }).success,
    ).toBe(false)
  })

  it('valida los filtros del historial tipo y rango de fechas', () => {
    expect(
      movementQuerySchema.safeParse({
        type: 'EXIT',
        from: '2026-09-01',
        to: '2026-09-30',
        page: 1,
        pageSize: 20,
      }).success,
    ).toBe(true)
    expect(movementQuerySchema.safeParse({ type: 'COMPRA' }).success).toBe(
      false,
    )
    expect(movementQuerySchema.safeParse({ from: '26/09/2026' }).success).toBe(
      false,
    )
  })

  it('limita la paginación de existencias e historial', () => {
    expect(
      existenceQuerySchema.safeParse({ page: 0, pageSize: 400 }).success,
    ).toBe(false)
    expect(
      movementQuerySchema.safeParse({ page: 2, pageSize: 5 }).success,
    ).toBe(true)
  })
})
