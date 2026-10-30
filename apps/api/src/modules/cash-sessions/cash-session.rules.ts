import { AppError } from '../../shared/errors/app-error.js'
import type {
  CashMethodTotals,
  CashPaymentMethod,
} from './cash-session.types.js'

export function roundCash(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function zeroMethodTotals(): CashMethodTotals {
  return { cash: 0, card: 0, transfer: 0, digitalWallet: 0 }
}

export function totalKey(method: CashPaymentMethod): keyof CashMethodTotals {
  switch (method) {
    case 'CASH':
      return 'cash'
    case 'CARD':
      return 'card'
    case 'TRANSFER':
      return 'transfer'
    case 'DIGITAL_WALLET':
      return 'digitalWallet'
  }
}

export function addMethodAmount(
  totals: CashMethodTotals,
  method: CashPaymentMethod,
  amount: number,
): CashMethodTotals {
  const key = totalKey(method)
  return { ...totals, [key]: roundCash(totals[key] + amount) }
}

export function subtractMethodTotals(
  payments: CashMethodTotals,
  compensations: CashMethodTotals,
): CashMethodTotals {
  return {
    cash: roundCash(payments.cash - compensations.cash),
    card: roundCash(payments.card - compensations.card),
    transfer: roundCash(payments.transfer - compensations.transfer),
    digitalWallet: roundCash(
      payments.digitalWallet - compensations.digitalWallet,
    ),
  }
}

export function assertNonNegativeCashAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(
      400,
      'CASH_SESSION_INVALID_AMOUNT',
      'El importe debe ser cero o mayor.',
    )
  }
}

export function assertClosingNotes(
  differenceAmount: number,
  notes: string | undefined,
): void {
  if (roundCash(differenceAmount) !== 0 && !notes?.trim()) {
    throw new AppError(
      400,
      'CASH_SESSION_DIFFERENCE_NOTES_REQUIRED',
      'Debes indicar el motivo de la diferencia de caja.',
    )
  }
}
