import { isAxiosError } from 'axios'
import type { SaleStatus } from '../types/sales.types'

export const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

export const quantityFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 3,
})

export const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function getSaleErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}

export function saleStatusLabel(status: SaleStatus) {
  return status === 'DRAFT' ? 'Borrador' : 'Confirmada'
}

export function saleLineSubtotal(line: {
  unitPrice: unknown
  quantity: unknown
}) {
  const unitPrice = Number(line.unitPrice)
  const quantity = Number(line.quantity)
  return Math.round((unitPrice * quantity + Number.EPSILON) * 100) / 100
}
