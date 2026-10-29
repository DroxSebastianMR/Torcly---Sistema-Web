import { isAxiosError } from 'axios'
import { currencyFormatter } from '@/features/work-orders/utils/work-order-formatters'
import type { Period } from '../types/reports.types'

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function defaultPeriod(): Period {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from: isoDate(from), to: isoDate(to) }
}

export function formatAmount(value: number): string {
  return currencyFormatter.format(value)
}

const quantityFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 3,
})

export function formatQuantity(value: number): string {
  return quantityFormatter.format(value)
}

const countFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 0,
})

export function formatCount(value: number): string {
  return countFormatter.format(value)
}

export function formatHours(value: number | null): string {
  if (value === null) return 'Sin datos'
  const formatted = new Intl.NumberFormat('es-PE', {
    maximumFractionDigits: 1,
  }).format(value)
  return `${formatted} h`
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

export function isForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403
}

export function lineTypeLabel(type: 'PRODUCT' | 'SERVICE'): string {
  return type === 'PRODUCT' ? 'Producto' : 'Servicio'
}

export const movementTypeLabel: Record<string, string> = {
  INITIAL: 'Stock inicial',
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT_IN: 'Ajuste de entrada',
  ADJUSTMENT_OUT: 'Ajuste de salida',
}
