import { isAxiosError } from 'axios'
import type { MovementType } from '../types/inventory.types'

export const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 3,
})

export const movementTypeLabels: Record<MovementType, string> = {
  INITIAL: 'Stock inicial',
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT_IN: 'Ajuste (ingreso)',
  ADJUSTMENT_OUT: 'Ajuste (egreso)',
}

export function formatMovementType(type: MovementType) {
  return movementTypeLabels[type]
}

export function formatMovementQuantity(type: MovementType, quantity: number) {
  const sign =
    type === 'INITIAL' || type === 'ENTRY' || type === 'ADJUSTMENT_IN'
      ? '+'
      : '−'
  return `${sign}${numberFormatter.format(Math.abs(quantity))}`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getInventoryErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}
