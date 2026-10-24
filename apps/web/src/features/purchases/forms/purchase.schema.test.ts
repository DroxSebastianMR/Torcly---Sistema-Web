import { describe, expect, it } from 'vitest'
import { purchaseFormSchema, purchaseLineSchema } from './purchase.schema'

describe('purchaseLineSchema (web)', () => {
  it('acepta una línea válida', () => {
    const result = purchaseLineSchema.safeParse({
      productId: 'p-1',
      quantity: 5,
      unitCost: 15.5,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza una línea sin productId', () => {
    const result = purchaseLineSchema.safeParse({
      productId: '',
      quantity: 5,
      unitCost: 15.5,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza cantidades menores o iguales a cero', () => {
    const zero = purchaseLineSchema.safeParse({
      productId: 'p-1',
      quantity: 0,
      unitCost: 10,
    })
    expect(zero.success).toBe(false)

    const neg = purchaseLineSchema.safeParse({
      productId: 'p-1',
      quantity: -1,
      unitCost: 10,
    })
    expect(neg.success).toBe(false)
  })

  it('acepta hasta tres decimales en cantidad y rechaza cuatro', () => {
    for (const quantity of [1, 1.2, 1.23, 1.234]) {
      expect(
        purchaseLineSchema.safeParse({
          productId: 'p-1',
          quantity,
          unitCost: 10,
        }).success,
      ).toBe(true)
    }

    const invalid = purchaseLineSchema.safeParse({
      productId: 'p-1',
      quantity: 1.2345,
      unitCost: 10,
    })
    expect(invalid.success).toBe(false)
  })

  it('rechaza costo unitario negativo', () => {
    const result = purchaseLineSchema.safeParse({
      productId: 'p-1',
      quantity: 1,
      unitCost: -0.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('purchaseFormSchema (web)', () => {
  const validForm = {
    supplierId: 's-1',
    purchaseDate: '2026-10-24',
    externalRef: 'FAC-001',
    notes: 'Entrega rápida',
    lines: [
      {
        productId: 'p-1',
        quantity: 2,
        unitCost: 20,
      },
    ],
  }

  it('acepta formulario de compra válido', () => {
    const result = purchaseFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('rechaza formulario sin proveedor', () => {
    const result = purchaseFormSchema.safeParse({
      ...validForm,
      supplierId: '',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza formulario sin líneas', () => {
    const result = purchaseFormSchema.safeParse({
      ...validForm,
      lines: [],
    })
    expect(result.success).toBe(false)
  })

  it('rechaza un producto repetido en las líneas', () => {
    const result = purchaseFormSchema.safeParse({
      ...validForm,
      lines: [validForm.lines[0], { ...validForm.lines[0], quantity: 3 }],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Cada producto solo puede agregarse una vez a la compra.',
      )
    }
  })
})
