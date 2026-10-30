import { describe, expect, it } from 'vitest'
import {
  cashSessionCloseSchema,
  cashSessionOpenSchema,
  cashSessionQuerySchema,
} from '../src/modules/cash-sessions/cash-session.schemas.js'

const requestId = 'a0000000-0000-4000-8000-000000000021'

describe('Schemas de sesiones de caja', () => {
  it('acepta apertura con monto cero y nota opcional', () => {
    expect(
      cashSessionOpenSchema.parse({ requestId, openingAmount: 0 }),
    ).toMatchObject({ requestId, openingAmount: 0 })
  })

  it('rechaza montos negativos y con más de dos decimales', () => {
    expect(() =>
      cashSessionOpenSchema.parse({ requestId, openingAmount: -1 }),
    ).toThrow(/cero o mayor/)
    expect(() =>
      cashSessionCloseSchema.parse({
        requestId,
        countedCashAmount: 10.123,
      }),
    ).toThrow(/dos decimales/)
  })

  it('aplica límites seguros a notas y paginación', () => {
    expect(() =>
      cashSessionCloseSchema.parse({
        requestId,
        countedCashAmount: 10,
        notes: 'X'.repeat(301),
      }),
    ).toThrow(/300 caracteres/)
    expect(cashSessionQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
    })
  })
})
