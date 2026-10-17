import { isAxiosError } from 'axios'
import type {
  ReplenishmentPeriod,
  ReplenishmentPriority,
  ReplenishmentReason,
} from '../types/replenishment.types'

export const quantityFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 3,
})

export const countFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 0,
})

export function formatQuantity(value: number): string {
  return quantityFormatter.format(value)
}

export function formatCount(value: number): string {
  return countFormatter.format(value)
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function defaultPeriod(): ReplenishmentPeriod {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from: isoDate(from), to: isoDate(to) }
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatPeriodLabel(
  from?: string | null,
  to?: string | null,
): string {
  if (!from || !to) return 'Período seleccionado'
  const format = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const parse = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const fromDate = parse(from)
  const toDate = parse(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return 'Período seleccionado'
  }
  return `${format.format(fromDate)} — ${format.format(toDate)}`
}

export const priorityLabels: Record<ReplenishmentPriority, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

export function formatPriority(priority: ReplenishmentPriority | null): string {
  return priority ? priorityLabels[priority] : '—'
}

export const reasonLabels: Record<ReplenishmentReason, string> = {
  INACTIVE_PRODUCT: 'Producto inactivo',
  INSUFFICIENT_DATA: 'Datos insuficientes',
}

export function formatReason(reason: ReplenishmentReason | null): string {
  return reason ? reasonLabels[reason] : '—'
}

export function getReplenishmentErrorMessage(error: unknown): string {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}
