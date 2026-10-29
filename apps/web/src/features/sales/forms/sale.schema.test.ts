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

  it('acepta hasta tres decimales y rechaza cuatro en línea y cantidad a agregar', () => {
    for (const quantity of [1, 1.2, 1.23, 1.234]) {
      expect(
        saleLineDraftSchema.safeParse({ ...productLine, quantity }).success,
      ).toBe(true)
      expect(
        saleFormSchema.safeParse({
          customerId: '',
          addQuantity: quantity,
          lines: [productLine],
        }).success,
      ).toBe(true)
    }

    const line = saleLineDraftSchema.safeParse({
      ...productLine,
      quantity: 1.2345,
    })
    expect(line.success).toBe(false)
    if (!line.success) {
      expect(line.error.issues[0]?.message).toBe(
        'La cantidad admite hasta tres decimales.',
      )
    }

    expect(
      saleFormSchema.safeParse({
        customerId: '',
        addQuantity: 1.2345,
        lines: [productLine],
      }).success,
    ).toBe(false)
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
