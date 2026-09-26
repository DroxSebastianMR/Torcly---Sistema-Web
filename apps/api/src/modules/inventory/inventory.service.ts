import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import { resolveAdjustmentType } from './inventory.rules.js'
import {
  inventoryRepository,
  type InventoryMovementRecord,
} from './inventory.repository.js'
import type {
  ExistenceFilters,
  InventoryMovementFilters,
  InventoryMovementResponse,
  MovementInput,
  MovementType,
} from './inventory.types.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUserId(value: string) {
  return uuidPattern.test(value)
}

function toResponse(
  movement: InventoryMovementRecord,
  actorNames = new Map<string, string>(),
): InventoryMovementResponse {
  return {
    id: movement.id,
    productId: movement.productId,
    product: movement.product,
    type: movement.type,
    quantity: Number(movement.quantity),
    notes: movement.notes,
    performedBy: actorNames.get(movement.performedBy) ?? movement.performedBy,
    occurredAt: movement.occurredAt.toISOString(),
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
  }
}

async function resolveActorNames(movements: InventoryMovementRecord[]) {
  const ids = [
    ...new Set(
      movements
        .map((movement) => movement.performedBy)
        .filter((performedBy) => isUserId(performedBy)),
    ),
  ]
  if (!ids.length) return new Map<string, string>()

  const users = await inventoryRepository.findUserDisplayNames(ids)
  return new Map(users.map((user) => [user.id, user.displayName]))
}

function paginate(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

async function handleMovementPersistenceError(
  error: unknown,
  idempotencyKey: string,
): Promise<InventoryMovementRecord> {
  if (error instanceof AppError) throw error

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'PRODUCT_REFERENCE_INVALID',
        'El producto seleccionado no está disponible.',
      )
    }

    if (error.code === 'P2025') {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
    }

    if (error.code === 'P2002') {
      const existing = await inventoryRepository.findByKey(idempotencyKey)
      if (existing) return existing
      throw new AppError(
        409,
        'INVENTORY_MOVEMENT_REJECTED',
        'La operación fue rechazada por un conflicto de duplicidad.',
      )
    }
  }

  throw error
}

export const inventoryService = {
  async listExistence(filters: ExistenceFilters) {
    const result = await inventoryRepository.listExistence(filters)
    return {
      data: result.items,
      pagination: paginate(result.total, filters.page, filters.pageSize),
    }
  },

  async listMovements(filters: InventoryMovementFilters) {
    const result = await inventoryRepository.listMovements(filters)
    const actorNames = await resolveActorNames(result.items)
    return {
      data: result.items.map((movement) => toResponse(movement, actorNames)),
      pagination: paginate(result.total, filters.page, filters.pageSize),
    }
  },

  async registerInitial(
    input: MovementInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    return this.registerMovement(input, 'INITIAL', actor, context)
  },

  async registerEntry(
    input: MovementInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    return this.registerMovement(input, 'ENTRY', actor, context)
  },

  async registerExit(
    input: MovementInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    return this.registerMovement(input, 'EXIT', actor, context)
  },

  async registerAdjustment(
    input: MovementInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const type = resolveAdjustmentType(input.quantity)
    const quantity = Math.abs(input.quantity)
    return this.registerMovement({ ...input, quantity }, type, actor, context)
  },

  async registerMovement(
    input: MovementInput,
    type: MovementType,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    try {
      const movement = await inventoryRepository.registerMovement(
        input,
        type,
        actor,
        context,
      )
      return { data: toResponse(movement) }
    } catch (error) {
      const movement = await handleMovementPersistenceError(
        error,
        input.idempotencyKey,
      )
      return { data: toResponse(movement) }
    }
  },
}
