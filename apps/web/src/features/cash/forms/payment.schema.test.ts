import { describe, expect, it } from 'vitest'
import {
  formatPaymentAmount,
  parsePaymentAmount,
  paymentCompensationSchema,
  paymentRegisterSchema,
} from './payment.schema'

const paymentBase = { method: 'CASH' as const, notes: '' }

describe('Esquema de importes de caja (QA-07)', () => {
  it('conserva el texto 100.00 y lo convierte a número al confirmar', () => {
    const parsed = paymentRegisterSchema.parse({
      ...paymentBase,
      amount: '100.00',
    })
    expect(parsed.amount).toBe('100.00')
    expect(parsePaymentAmount(parsed.amount)).toBe(100)
  })

  it('acepta el punto decimal intermedio mientras se escribe', () => {
    expect(parsePaymentAmount('100.')).toBe(100)
    expect(parsePaymentAmount('100.5')).toBe(100.5)
    expect(parsePaymentAmount(' 100.00 ')).toBe(100)
  })

  it('rechaza importes vacíos, cero, negativos o con más de dos decimales', () => {
    for (const amount of ['', ' ', '0', '0.00', '-5', '100.001', 'abc']) {
      expect(
        paymentRegisterSchema.safeParse({ ...paymentBase, amount }).success,
      ).toBe(false)
    }
  })

  it('rechaza importes por encima del máximo permitido', () => {
    expect(
      paymentRegisterSchema.safeParse({
        ...paymentBase,
        amount: '999999999.01',
      }).success,
    ).toBe(false)
  })

  it('formatea el importe con dos decimales al salir del campo', () => {
    expect(formatPaymentAmount(100)).toBe('100.00')
    expect(formatPaymentAmount(100.5)).toBe('100.50')
  })

  it('la compensación exige importe y motivo válidos', () => {
    expect(
      paymentCompensationSchema.safeParse({ amount: '10.00', reason: '' })
        .success,
    ).toBe(false)
    expect(
      paymentCompensationSchema.safeParse({
        amount: '10.00',
        reason: 'Cobro duplicado',
      }).success,
    ).toBe(true)
  })
})
