import { AppError } from '../../shared/errors/app-error.js'
import type { PaymentCollectionStatus, PaymentType } from './payment.types.js'

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function toCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100)
}

export function computePaidAmount(
  events: ReadonlyArray<{ type: PaymentType; amount: unknown }>,
): number {
  const total = events.reduce((sum, event) => {
    const amount = toCents(Number(event.amount))
    return event.type === 'PAYMENT' ? sum + amount : sum - amount
  }, 0)
  return roundMoney(total / 100)
}

export function computeBalance(total: unknown, paid: number): number {
  return roundMoney(Number(total) - paid)
}

export function collectionStatusFromBalance(
  paid: number,
  balance: number,
): PaymentCollectionStatus {
  if (toCents(paid) <= 0) return 'PENDING'
  if (toCents(balance) <= 0) return 'PAID'
  return 'PARTIALLY_PAID'
}

export function assertValidPaymentAmount(amount: number): void {
  if (!Number.isFinite(amount) || toCents(amount) <= 0) {
    throw new AppError(
      400,
      'PAYMENT_INVALID_AMOUNT',
      'El importe debe ser mayor a cero.',
    )
  }
}

export function assertPaymentDoesNotExceedBalance(
  amount: number,
  balance: number,
): void {
  if (toCents(amount) > toCents(balance)) {
    throw new AppError(
      409,
      'PAYMENT_EXCEEDS_BALANCE',
      'El importe supera el saldo pendiente de la venta.',
    )
  }
}

export function assertCompensationWithinPayment(
  amount: number,
  originalAmount: number,
  alreadyCompensated: number,
): void {
  const net = toCents(originalAmount) - toCents(alreadyCompensated)
  if (toCents(amount) > net) {
    throw new AppError(
      409,
      'PAYMENT_COMPENSATION_EXCEEDS',
      'La compensación supera el importe neto del pago original.',
    )
  }
}
