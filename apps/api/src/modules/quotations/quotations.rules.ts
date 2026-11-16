import { AppError } from '../../shared/errors/app-error.js'

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function computeQuotationTotals(
  items: Array<{ unitPrice: number; quantity: number }>,
): { subtotal: number; total: number } {
  const total = items.reduce(
    (sum, item) => sum + roundMoney(item.unitPrice * item.quantity),
    0,
  )
  const rounded = roundMoney(total)
  return { subtotal: rounded, total: rounded }
}

export function assertHasItems(items: unknown[]): void {
  if (!items || items.length === 0) {
    throw new AppError(
      400,
      'QUOTATION_EMPTY_ITEMS',
      'La cotización debe contener al menos un producto o servicio.',
    )
  }
}
