import { describe, expect, it } from 'vitest'
import { movementFormSchema, movementKindSchema } from './movement.schema'

describe('Esquema de movimientos de inventario (web)', () => {
  it('acepta un movimiento válido con todos los campos', () => {
    const result = movementFormSchema.safeParse({
      productId: 'p1',
      quantity: 5,
      sign: 'IN',
      notes: 'Ingreso por compra',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza la cantidad en cero o negativa', () => {
    const zero = movementFormSchema.safeParse({
      productId: 'p1',
      quantity: 0,
      sign: 'OUT',
      notes: '',
    })
    expect(zero.success).toBe(false)

    const negative = movementFormSchema.safeParse({
      productId: 'p1',
      quantity: -2,
      sign: 'OUT',
      notes: '',
    })
    expect(negative.success).toBe(false)
  })

  it('exige seleccionar un producto', () => {
    const result = movementFormSchema.safeParse({
      productId: '',
      quantity: 3,
      sign: 'IN',
      notes: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Selecciona un producto.')
    }
  })

  it('limita las notas a 300 caracteres', () => {
    const result = movementFormSchema.safeParse({
      productId: 'p1',
      quantity: 1,
      sign: 'IN',
      notes: 'a'.repeat(301),
    })
    expect(result.success).toBe(false)
  })

  it('normaliza el signo dentro de los tipos de movimiento soportados', () => {
    const valid = movementKindSchema.safeParse('ADJUSTMENT')
    expect(valid.success).toBe(true)

    const invalid = movementKindSchema.safeParse('TRANSFER')
    expect(invalid.success).toBe(false)
  })
})
