import { AppError } from '../../shared/errors/app-error.js'
import type { MovementType } from './inventory.types.js'

const positiveMovementTypes: ReadonlySet<MovementType> = new Set([
  'INITIAL',
  'ENTRY',
  'ADJUSTMENT_IN',
])

export function computeStock(
  movements: readonly { type: MovementType; quantity: unknown }[],
): number {
  return movements.reduce((stock, movement) => {
    const quantity = Number(movement.quantity)
    return positiveMovementTypes.has(movement.type)
      ? stock + quantity
      : stock - quantity
  }, 0)
}

export function resolveAdjustmentType(quantity: number): MovementType {
  return quantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
}

export function assertCanRegisterMovement(params: {
  type: MovementType
  quantity: number
  currentStock: number
  hasInitialMovement: boolean
}) {
  if (params.type === 'INITIAL' && params.hasInitialMovement) {
    throw new AppError(
      409,
      'INVENTORY_INITIAL_ALREADY_EXISTS',
      'El producto ya tiene un stock inicial registrado.',
    )
  }

  if (
    (params.type === 'EXIT' || params.type === 'ADJUSTMENT_OUT') &&
    params.quantity > params.currentStock
  ) {
    throw new AppError(
      409,
      'INSUFFICIENT_STOCK',
      `Stock insuficiente: disponible ${params.currentStock} y se requieren ${params.quantity}.`,
    )
  }
}
