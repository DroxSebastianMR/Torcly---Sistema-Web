import { AppError } from '../../shared/errors/app-error.js'
import type {
  ReportBlock,
  ReportDescriptor,
  ReportGranularity,
  ReportPeriod,
} from './reports.types.js'
import { REPORT_BLOCKS } from './reports.types.js'

export const DEFAULT_PERIOD_DAYS = 30

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

export const BLOCK_PERMISSIONS: Record<ReportBlock, readonly string[]> = {
  sales: ['sales:read'],
  payments: ['cash:read', 'sales:read'],
  inventory: ['inventory:read'],
  services: ['sales:read', 'services:read'],
  workshop: ['workshop:read', 'appointments:read'],
}

export const BLOCK_DESCRIPTORS: Record<ReportBlock, ReportDescriptor> = {
  sales: {
    block: 'sales',
    label: 'Ventas',
    source: 'sales',
    periodField: 'confirmedAt',
    criteria:
      'Muestra las ventas finalizadas en el período seleccionado. El importe es el total vendido y el ticket promedio indica cuánto se vende, en promedio, por cada venta.',
    trendMeasure: 'Ventas e importe',
    permissions: [...BLOCK_PERMISSIONS.sales],
  },
  payments: {
    block: 'payments',
    label: 'Cobros',
    source: 'payments',
    periodField: 'occurredAt (cobrado); instantánea (saldos)',
    criteria:
      'Resume lo cobrado durante el período. El saldo pendiente muestra lo que aún falta cobrar hoy, por lo que no cambia al modificar las fechas.',
    trendMeasure: 'Cobrado neto',
    permissions: [...BLOCK_PERMISSIONS.payments],
  },
  inventory: {
    block: 'inventory',
    label: 'Inventario',
    source: 'inventory_movements',
    periodField: 'occurredAt (movimientos); instantánea (stock bajo)',
    criteria:
      'Muestra las entradas y salidas registradas en el período. El stock bajo refleja los productos que hoy requieren reposición.',
    trendMeasure: 'Movimientos y cantidad neta',
    permissions: [...BLOCK_PERMISSIONS.inventory],
  },
  services: {
    block: 'services',
    label: 'Servicios',
    source: 'sale_lines (SERVICE) y services',
    periodField: 'confirmedAt (venta de la línea)',
    criteria:
      'Muestra los servicios vendidos en el período. El importe corresponde a lo facturado y las unidades a la cantidad de servicios realizados.',
    trendMeasure: 'Unidades e importe',
    permissions: [...BLOCK_PERMISSIONS.services],
  },
  workshop: {
    block: 'workshop',
    label: 'Taller',
    source: 'work_orders y appointments',
    periodField: 'createdAt (órdenes); deliveredAt (entregas); date (citas)',
    criteria:
      'Resume las órdenes y citas del taller en el período. También muestra las entregas realizadas y el tiempo promedio que tomó completar una orden.',
    trendMeasure: 'Órdenes y entregas',
    permissions: [...BLOCK_PERMISSIONS.workshop],
  },
}

export function isReportBlock(value: string): value is ReportBlock {
  return (REPORT_BLOCKS as readonly string[]).includes(value)
}

export function canAccessBlock(
  block: ReportBlock,
  permissions: readonly string[],
): boolean {
  return BLOCK_PERMISSIONS[block].every((permission) =>
    permissions.includes(permission),
  )
}

export function authorizedBlocks(
  permissions: readonly string[],
): ReportBlock[] {
  return REPORT_BLOCKS.filter((block) => canAccessBlock(block, permissions))
}

export function assertBlockAccess(
  block: ReportBlock,
  permissions: readonly string[],
): void {
  if (!canAccessBlock(block, permissions)) {
    throw new AppError(
      403,
      'REPORTS_BLOCK_FORBIDDEN',
      'No tienes permiso para consultar este bloque de reporte.',
    )
  }
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export function addDaysISO(value: string, days: number): string {
  const date = parseISODate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return toISODate(date)
}

export function todayISO(): string {
  return toISODate(new Date())
}

function padMonth(value: number): string {
  return String(value).padStart(2, '0')
}

export function resolvePeriod(
  from: string | null | undefined,
  to: string | null | undefined,
): ReportPeriod {
  const normalizedFrom = from?.trim() || null
  const normalizedTo = to?.trim() || null
  const finalTo = normalizedTo ?? todayISO()
  const finalFrom = normalizedFrom ?? addDaysISO(finalTo, -DEFAULT_PERIOD_DAYS)
  if (finalFrom > finalTo) {
    throw new AppError(
      400,
      'REPORTS_DATE_RANGE_INVALID',
      'La fecha inicial no puede ser posterior a la fecha final.',
    )
  }
  return { from: finalFrom, to: finalTo }
}

function daysBetween(from: string, to: string): number {
  const start = parseISODate(from).getTime()
  const end = parseISODate(to).getTime()
  return Math.round((end - start) / 86_400_000) + 1
}

export function resolveGranularity(
  from: string,
  to: string,
): ReportGranularity {
  const days = daysBetween(from, to)
  if (days <= 15) return 'day'
  if (days <= 186) return 'week'
  return 'month'
}

function weekStartISO(value: string): string {
  const date = parseISODate(value)
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  return toISODate(date)
}

export function bucketKey(date: Date, granularity: ReportGranularity): string {
  if (granularity === 'day') return toISODate(date)
  if (granularity === 'week') return weekStartISO(toISODate(date))
  return toISODate(date).slice(0, 7)
}

function dayLabel(value: string): string {
  const [, month, day] = value.split('-')
  return `${parseInt(day, 10)} ${MONTH_LABELS[parseInt(month, 10) - 1]}`
}

function monthLabel(value: string): string {
  const [year, month] = value.split('-')
  return `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`
}

export function bucketLabel(
  key: string,
  granularity: ReportGranularity,
): string {
  if (granularity === 'day') return dayLabel(key)
  if (granularity === 'week') {
    const end = addDaysISO(key, 6)
    if (key.slice(0, 7) === end.slice(0, 7)) {
      return `${parseInt(key.slice(8, 10), 10)}–${dayLabel(end)}`
    }
    return `${dayLabel(key)}–${dayLabel(end)}`
  }
  return monthLabel(key)
}

export function buildBuckets(
  from: string,
  to: string,
  granularity: ReportGranularity,
): Array<{ key: string; label: string }> {
  const buckets: Array<{ key: string; label: string }> = []
  if (granularity === 'month') {
    let year = parseInt(from.slice(0, 4), 10)
    let month = parseInt(from.slice(5, 7), 10)
    const endKey = to.slice(0, 7)
    while (`${year}-${padMonth(month)}` <= endKey) {
      const key = `${year}-${padMonth(month)}`
      buckets.push({ key, label: bucketLabel(key, granularity) })
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
    return buckets
  }

  const step = granularity === 'week' ? 7 : 1
  const firstKey =
    granularity === 'week'
      ? weekStartISO(from)
      : bucketKey(parseISODate(from), granularity)
  let cursor = firstKey
  let iterations = 0
  while (cursor <= to && iterations < 10_000) {
    buckets.push({ key: cursor, label: bucketLabel(cursor, granularity) })
    cursor = addDaysISO(cursor, step)
    iterations += 1
  }
  return buckets
}

export function allZeros(value: Record<string, number>): boolean {
  return Object.values(value).every((number) => number === 0)
}
