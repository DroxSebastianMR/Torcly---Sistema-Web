import { describe, expect, it } from 'vitest'
import {
  assertCompensationWithinPayment,
  assertPaymentDoesNotExceedBalance,
  assertValidPaymentAmount,
  collectionStatusFromBalance,
  computeBalance,
  computePaidAmount,
  roundMoney,
  toCents,
} from '../src/modules/payments/payment.rules.js'

describe('Reglas aritméticas de cobros', () => {
  it('redondea montos a dos decimales en céntimos', () => {
    expect(toCents(50.5)).toBe(5050)
    expect(toCents(0.1)).toBe(10)
    expect(roundMoney(10.005)).toBe(10.01)
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
  })

  it('calcula el saldo pendiente como total menos lo abonado', () => {
    expect(computeBalance(130, 30)).toBe(100)
    expect(computeBalance(130, 130)).toBe(0)
  })

  it('suma pagos parciales y resta compensaciones al calcular lo cobrado', () => {
    const payments: Array<{
      type: 'PAYMENT' | 'COMPENSATION'
      amount: number
    }> = [
      { type: 'PAYMENT', amount: 50 },
      { type: 'PAYMENT', amount: 30.5 },
      { type: 'COMPENSATION', amount: 20 },
    ]
    expect(computePaidAmount(payments)).toBe(60.5)
  })

  it('deriva estados de cobro desde el saldo', () => {
    expect(collectionStatusFromBalance(0, 130)).toBe('PENDING')
    expect(collectionStatusFromBalance(50, 80)).toBe('PARTIALLY_PAID')
    expect(collectionStatusFromBalance(130, 0)).toBe('PAID')
    expect(collectionStatusFromBalance(130, -0.5)).toBe('PAID')
  })

  it('rechaza importes no positivos o con más de dos decimales', () => {
    expect(() => assertValidPaymentAmount(0)).toThrow(/mayor a cero/)
    expect(() => assertValidPaymentAmount(-5)).toThrow(/mayor a cero/)
    expect(() => assertValidPaymentAmount(Number.NaN)).toThrow(/mayor a cero/)
  })

  it('rechaza pagos que superan el saldo pendiente', () => {
    expect(() => assertPaymentDoesNotExceedBalance(100.01, 100)).toThrow(
      /supera el saldo pendiente/,
    )
    expect(() => assertPaymentDoesNotExceedBalance(100, 100)).not.toThrow()
    expect(() => assertPaymentDoesNotExceedBalance(0.01, 100)).not.toThrow()
  })

  it('rechaza compensaciones que superan el neto del pago original', () => {
    expect(() => assertCompensationWithinPayment(60, 50, 0)).toThrow(
      /supera el importe neto/,
    )
    expect(() => assertCompensationWithinPayment(50, 100, 60)).toThrow(
      /supera el importe neto/,
    )
    expect(() => assertCompensationWithinPayment(40, 100, 60)).not.toThrow()
  })
})
