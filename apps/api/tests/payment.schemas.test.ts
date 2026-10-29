import { describe, expect, it } from 'vitest'
import {
  paymentCompensateSchema,
  paymentQuerySchema,
  paymentRegisterSchema,
} from '../src/modules/payments/payment.schemas.js'

const requestId = 'a0000000-0000-4000-8000-000000000001'

describe('Schemas de cobros', () => {
  it('acepta un pago válido con observación opcional', () => {
    const result = paymentRegisterSchema.parse({
      requestId,
      amount: 50.5,
      method: 'CASH',
      notes: 'Primera cuota',
    })
    expect(result).toMatchObject({ amount: 50.5, method: 'CASH' })
  })

  it('rechaza importes con más de dos decimales', () => {
    expect(() =>
      paymentRegisterSchema.parse({
        requestId,
        amount: 50.123,
        method: 'CASH',
      }),
    ).toThrow(/dos decimales/)
  })

  it('rechaza importes no positivos y métodos desconocidos', () => {
    expect(() =>
      paymentRegisterSchema.parse({ requestId, amount: 0, method: 'CASH' }),
    ).toThrow(/mayor a cero/)
    expect(() =>
      paymentRegisterSchema.parse({ requestId, amount: 10, method: 'CHEQUE' }),
    ).toThrow(/Invalid option/)
  })

  it('exige un requestId UUID válido', () => {
    expect(() =>
      paymentRegisterSchema.parse({
        requestId: 'no-uuid',
        amount: 10,
        method: 'CASH',
      }),
    ).toThrow(/identificador/)
  })

  it('exige motivo y lo limita en la compensación', () => {
    expect(() =>
      paymentCompensateSchema.parse({ requestId, amount: 10, reason: '  ' }),
    ).toThrow(/motivo/)
    expect(() =>
      paymentCompensateSchema.parse({
        requestId,
        amount: 10,
        reason: 'X'.repeat(301),
      }),
    ).toThrow(/300 caracteres/)
    expect(
      paymentCompensateSchema.parse({
        requestId,
        amount: 10,
        reason: 'Cobro duplicado',
      }),
    ).toMatchObject({ reason: 'Cobro duplicado' })
  })

  it('parsea la consulta con filtros y fechas con formato AAAA-MM-DD', () => {
    const result = paymentQuerySchema.parse({
      search: 'venta',
      status: 'PARTIALLY_PAID',
      method: 'TRANSFER',
      from: '2026-10-01',
      to: '2026-10-31',
      page: '2',
      pageSize: '15',
    })
    expect(result).toMatchObject({
      status: 'PARTIALLY_PAID',
      method: 'TRANSFER',
      page: 2,
      pageSize: 15,
    })
    expect(() => paymentQuerySchema.parse({ from: '01-10-2026' })).toThrow(
      /AAAA-MM-DD/,
    )
  })

  it('rechaza propiedades desconocidas en el cuerpo', () => {
    expect(() =>
      paymentRegisterSchema.parse({
        requestId,
        amount: 10,
        method: 'CASH',
        saleId: 'extra',
      }),
    ).toThrow()
  })

  it('aplica valores por defecto en la consulta', () => {
    const result = paymentQuerySchema.parse({})
    expect(result).toMatchObject({
      search: '',
      status: 'all',
      method: 'all',
      page: 1,
      pageSize: 20,
    })
  })
})
