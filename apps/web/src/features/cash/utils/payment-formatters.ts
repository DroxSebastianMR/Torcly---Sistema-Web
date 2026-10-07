import { isAxiosError } from 'axios'
import type {
  PaymentCollectionStatus,
  PaymentMethod,
} from '../types/payment.types'

export const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

export const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  DIGITAL_WALLET: 'Billetera digital',
}

export function paymentCollectionStatusLabel(status: PaymentCollectionStatus) {
  if (status === 'PAID') return 'Pagado'
  if (status === 'PARTIALLY_PAID') return 'Parcialmente pagado'
  return 'Pendiente'
}

export function getPaymentErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}
