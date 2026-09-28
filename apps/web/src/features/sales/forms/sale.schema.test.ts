import { describe, expect, it } from 'vitest'
import {
  createSaleDraft,
  saleFormSchema,
  saleLineDraftSchema,
} from './sale.schema'

const productLine = {
  type: 'PRODUCT' as const,
  referenceId: 'p1',
  name: 'Filtro de aceite',
  code: 'REP-001',
  unitLabel: 'und',
  unitPrice: 12.5,
  quantity: 2,
}

describe('Esquema de ventas (web)', () => {
  it('acepta un formulario válido con producto y servicio', () => {
    const result = saleFormSchema.safeParse({
      customerId: 'c1',
      addQuantity: 1,
      lines: [
        productLine,
        {
          type: 'SERVICE',
          referenceId: 'sv1',
          name: 'Cambio de bomba',
          code: 'CAMBIO-BOMBA',
          unitLabel: null,
          unitPrice: 250.5,
          quantity: 1,
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('acepta una venta sin cliente', () => {
    const result = saleFormSchema.safeParse({
      customerId: '',
      addQuantity: 1,
      lines: [productLine],
    })

    expect(result.success).toBe(true)
  })

  it('exige al menos una línea', () => {
    const result = saleFormSchema.safeParse({
      customerId: '',
      addQuantity: 1,
      lines: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Agrega al menos un producto o servicio.',
      )
    }
  })

  it('rechaza una línea sin referencia', () => {
    const result = saleLineDraftSchema.safeParse({
      ...productLine,
      referenceId: '',
    })

    expect(result.success).toBe(false)
  })

  it('rechaza cantidades nulas o negativas', () => {
    const cero = saleLineDraftSchema.safeParse({ ...productLine, quantity: 0 })
    expect(cero.success).toBe(false)

    const negativa = saleLineDraftSchema.safeParse({
      ...productLine,
      quantity: -1,
    })
    expect(negativa.success).toBe(false)
  })

  it('rechaza un precio de línea negativo', () => {
    const result = saleLineDraftSchema.safeParse({
      ...productLine,
      unitPrice: -1,
    })

    expect(result.success).toBe(false)
  })

  it('combina la línea con su cantidad al crear el borrador', () => {
    const draft = createSaleDraft(
      {
        type: 'PRODUCT',
        referenceId: 'p1',
        name: 'Filtro de aceite',
        code: 'REP-001',
        unitLabel: 'und',
        unitPrice: 12.5,
      },
      3,
    )

    expect(draft).toEqual({ ...productLine, quantity: 3 })
  })
})
