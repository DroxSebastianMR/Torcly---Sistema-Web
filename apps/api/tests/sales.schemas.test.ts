import { describe, expect, it } from 'vitest'
import {
  saleIdSchema,
  saleInputSchema,
  saleQuerySchema,
  saleUpdateSchema,
} from '../src/modules/sales/sales.schemas.js'

const productId = 'a0000000-0000-4000-8000-000000000001'
const serviceId = 'a0000000-0000-4000-8000-000000000002'
const customerId = 'a0000000-0000-4000-8000-000000000003'

const validSale = {
  customerId,
  lines: [
    { type: 'PRODUCT', productId, quantity: 2 },
    { type: 'SERVICE', serviceId },
  ],
}

describe('Validación de ventas', () => {
  it('acepta una venta válida y conserva el cliente', () => {
    const parsed = saleInputSchema.parse(validSale)
    expect(parsed.customerId).toBe(customerId)
    expect(parsed.lines).toHaveLength(2)
    expect(parsed.lines[0]).toMatchObject({ type: 'PRODUCT', quantity: 2 })
  })

  it('normaliza cliente vacío a nulo y permite venta sin cliente', () => {
    const parsed = saleInputSchema.parse({
      customerId: undefined,
      lines: [validSale.lines[0]],
    })
    expect(parsed.customerId).toBeNull()
  })

  it('rechaza líneas sin producto o servicio, y servicio con cantidad', () => {
    expect(
      saleInputSchema.safeParse({ lines: [{ type: 'PRODUCT' }] }).success,
    ).toBe(false)
    expect(
      saleInputSchema.safeParse({
        lines: [{ type: 'SERVICE' }],
      }).success,
    ).toBe(false)
    expect(
      saleInputSchema.safeParse({
        lines: [
          {
            type: 'SERVICE',
            serviceId,
            quantity: 2,
          },
        ],
      }).success,
    ).toBe(false)
  })

  it('rechaza cantidades inválidas en líneas de producto', () => {
    const parse = (quantity: unknown) =>
      saleInputSchema.safeParse({
        lines: [{ type: 'PRODUCT', productId, quantity }],
      }).success
    expect(parse(0)).toBe(false)
    expect(parse(-2)).toBe(false)
  })

  it('rechaza ventas sin líneas y campos desconocidos', () => {
    expect(
      saleInputSchema.safeParse({ customerId: null, lines: [] }).success,
    ).toBe(false)
    expect(
      saleInputSchema.safeParse({ ...validSale, discount: 5 }).success,
    ).toBe(false)
  })

  it('rechaza identificadores inválidos', () => {
    expect(
      saleInputSchema.safeParse({
        customerId: 'no-uuid',
        lines: validSale.lines,
      }).success,
    ).toBe(false)
    expect(saleIdSchema.safeParse({ id: 'raro' }).success).toBe(false)
    expect(saleIdSchema.safeParse({ id: customerId }).success).toBe(true)
  })

  it('valida paginación y estado en la consulta', () => {
    expect(saleQuerySchema.parse({}).status).toBe('all')
    expect(saleQuerySchema.parse({ status: 'CONFIRMED' }).status).toBe(
      'CONFIRMED',
    )
    expect(saleQuerySchema.safeParse({ status: 'PAID' }).success).toBe(false)
    expect(saleQuerySchema.safeParse({ pageSize: 500 }).success).toBe(false)
    expect(saleQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })

  it('acepta el mismo payload en la actualización', () => {
    expect(saleUpdateSchema.safeParse(validSale).success).toBe(true)
  })
})
