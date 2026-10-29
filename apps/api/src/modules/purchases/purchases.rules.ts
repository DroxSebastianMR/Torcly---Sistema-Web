import { AppError } from '../../shared/errors/app-error.js'
import type { PurchaseStatus } from './purchases.types.js'

export function assertCanEditPurchase(status: PurchaseStatus): void {
  if (status !== 'DRAFT') {
    throw new AppError(
      409,
      'PURCHASE_READONLY',
      'Solo se pueden editar compras en borrador.',
    )
  }
}

export function assertCanConfirmPurchase(status: PurchaseStatus): void {
  if (status === 'RECEIVED') {
    throw new AppError(
      409,
      'PURCHASE_ALREADY_RECEIVED',
      'Esta compra ya fue recibida.',
    )
  }
  if (status === 'CANCELLED') {
    throw new AppError(
      409,
      'PURCHASE_CANCELLED',
      'No se puede confirmar una compra cancelada.',
    )
  }
}

export function assertCanCancelPurchase(status: PurchaseStatus): void {
  if (status === 'RECEIVED') {
    throw new AppError(
      409,
      'PURCHASE_RECEIVED',
      'No se puede cancelar una compra ya recibida.',
    )
  }
  if (status === 'CANCELLED') {
    throw new AppError(
      409,
      'PURCHASE_ALREADY_CANCELLED',
      'Esta compra ya fue cancelada.',
    )
  }
}

export function computePurchaseTotal(
  lines: ReadonlyArray<{
    quantity: number | unknown
    unitCost: number | unknown
  }>,
): number {
  const total = lines.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.unitCost),
    0,
  )
  return Math.round((total + Number.EPSILON) * 100) / 100
}

export function assertHasPurchaseLines(lines: ReadonlyArray<unknown>): void {
  if (lines.length === 0) {
    throw new AppError(400, 'PURCHASE_NO_LINES', 'Agrega al menos un producto.')
  }
}
