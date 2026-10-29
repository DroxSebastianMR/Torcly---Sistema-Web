import { AppError } from '../../shared/errors/app-error.js'
import type { SaleLineType } from './sales.types.js'

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeSaleTotals(
  lines: ReadonlyArray<{ unitPrice: unknown; quantity: unknown }>,
): { subtotal: number; total: number } {
  const subtotal = roundMoney(
    lines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * Number(line.quantity),
      0,
    ),
  )
  return { subtotal, total: subtotal }
}

export function assertHasLines(lines: ReadonlyArray<unknown>): void {
  if (lines.length === 0) {
    throw new AppError(
      400,
      'SALE_NO_LINES',
      'Agrega al menos un producto o servicio.',
    )
  }
}

export function aggregateProductQuantities(
  lines: ReadonlyArray<{
    type: SaleLineType
    productId: string | null
    quantity: unknown
  }>,
): Map<string, number> {
  const aggregated = new Map<string, number>()
  for (const line of lines) {
    if (line.type !== 'PRODUCT' || !line.productId) {
      continue
    }
    const numeric = Number(line.quantity)
    aggregated.set(
      line.productId,
      (aggregated.get(line.productId) ?? 0) + numeric,
    )
  }
  return aggregated
}
