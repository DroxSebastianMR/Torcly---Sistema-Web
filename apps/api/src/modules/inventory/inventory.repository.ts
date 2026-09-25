import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import type {
  ExistenceFilters,
  InventoryMovementFilters,
  MovementInput,
  MovementType,
} from './inventory.types.js'
import { assertCanRegisterMovement, computeStock } from './inventory.rules.js'

const movementResponseSelect = {
  id: true,
  productId: true,
  type: true,
  quantity: true,
  notes: true,
  performedBy: true,
  occurredAt: true,
  referenceType: true,
  referenceId: true,
  status: true,
  product: {
    select: {
      id: true,
      code: true,
      name: true,
      unit: { select: { name: true, symbol: true } },
    },
  },
} satisfies Prisma.InventoryMovementSelect

const existenceSelect = {
  id: true,
  code: true,
  name: true,
  minimumStock: true,
  active: true,
  unit: { select: { name: true, symbol: true } },
} satisfies Prisma.ProductSelect

function buildExistenceWhere(
  filters: ExistenceFilters,
): Prisma.ProductWhereInput {
  const search = filters.search?.trim()
  return search
    ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}
}

function buildMovementWhere(
  filters: InventoryMovementFilters,
): Prisma.InventoryMovementWhereInput {
  const from = filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : null
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : null

  return {
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(from || to
      ? {
          occurredAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  }
}

function auditData(
  event: AuditEventType,
  actorId: string,
  identifier: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

type MovementRecord = Prisma.InventoryMovementGetPayload<{
  select: typeof movementResponseSelect
}>

const auditEventByType: Record<MovementType, AuditEventType> = {
  INITIAL: 'INVENTORY_STOCK_INITIALIZED',
  ENTRY: 'INVENTORY_ENTRY_REGISTERED',
  EXIT: 'INVENTORY_EXIT_REGISTERED',
  ADJUSTMENT_IN: 'INVENTORY_ADJUSTMENT_REGISTERED',
  ADJUSTMENT_OUT: 'INVENTORY_ADJUSTMENT_REGISTERED',
}

export const inventoryRepository = {
  async listExistence(filters: ExistenceFilters) {
    return databaseService.transaction(async (transaction) => {
      const where = buildExistenceWhere(filters)
      const [products, total] = await Promise.all([
        transaction.product.findMany({
          select: existenceSelect,
          where,
          orderBy: [{ active: 'desc' }, { name: 'asc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.product.count({ where }),
      ])

      if (!products.length) return { items: [], total }

      const movements = await transaction.inventoryMovement.findMany({
        where: { productId: { in: products.map((product) => product.id) } },
        select: {
          productId: true,
          type: true,
          quantity: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: 'desc' },
      })

      const grouped = new Map<
        string,
        Array<{ type: MovementType; quantity: unknown }>
      >()
      const lastMovementAt = new Map<string, Date>()
      for (const movement of movements) {
        const list = grouped.get(movement.productId) ?? []
        list.push(movement)
        grouped.set(movement.productId, list)
        if (!lastMovementAt.has(movement.productId)) {
          lastMovementAt.set(movement.productId, movement.occurredAt)
        }
      }

      const items = products.map((product) => {
        const stock = computeStock(grouped.get(product.id) ?? [])
        const minimumStock = Number(product.minimumStock)
        const latest = lastMovementAt.get(product.id)
        return {
          productId: product.id,
          code: product.code,
          name: product.name,
          unit: product.unit,
          active: product.active,
          stock,
          minimumStock,
          lowStock: product.active && stock <= minimumStock,
          lastMovementAt: latest ? latest.toISOString() : null,
        }
      })

      return { items, total }
    })
  },

  listMovements(filters: InventoryMovementFilters) {
    const where = buildMovementWhere(filters)
    return databaseService.transaction(async (transaction) => {
      const [items, total] = await Promise.all([
        transaction.inventoryMovement.findMany({
          select: movementResponseSelect,
          where,
          orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.inventoryMovement.count({ where }),
      ])
      return { items, total }
    })
  },

  findByKey(idempotencyKey: string) {
    return databaseService.client.inventoryMovement.findUnique({
      where: { idempotencyKey },
      select: movementResponseSelect,
    })
  },

  async registerMovement(
    input: MovementInput,
    type: MovementType,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<MovementRecord> {
    return databaseService.transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: input.productId },
        select: { id: true, code: true, name: true, active: true },
      })
      if (!product)
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
      if (!product.active)
        throw new AppError(
          409,
          'PRODUCT_INACTIVE',
          'El producto está inactivo y no admite movimientos.',
        )

      if (input.idempotencyKey) {
        const existing = await transaction.inventoryMovement.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: { ...movementResponseSelect },
        })
        if (existing) {
          if (existing.productId !== input.productId || existing.type !== type)
            throw new AppError(
              409,
              'INVENTORY_IDEMPOTENCY_CONFLICT',
              'La clave de idempotencia ya corresponde a otra operación.',
            )
          return existing
        }
      }

      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:inventory:${input.productId}`}))`

      const confirmed = await transaction.inventoryMovement.findMany({
        where: { productId: input.productId, status: 'CONFIRMED' },
        select: { type: true, quantity: true },
      })
      const currentStock = computeStock(confirmed)
      const hasInitialMovement = confirmed.some(
        (movement) => movement.type === 'INITIAL',
      )
      assertCanRegisterMovement({
        type,
        quantity: input.quantity,
        currentStock,
        hasInitialMovement,
      })

      const movement = await transaction.inventoryMovement.create({
        data: {
          productId: input.productId,
          type,
          status: 'CONFIRMED',
          quantity: input.quantity,
          idempotencyKey: input.idempotencyKey || null,
          notes: input.notes || null,
          performedBy: actor.name,
          occurredAt:
            input.occurredAt instanceof Date ? input.occurredAt : new Date(),
          referenceType: input.referenceType || null,
          referenceId: input.referenceId || null,
        },
        select: movementResponseSelect,
      })

      const stockAfter = computeStock([
        ...confirmed,
        { type: movement.type, quantity: movement.quantity },
      ])

      await transaction.auditLog.create({
        data: auditData(
          auditEventByType[type],
          actor.id,
          product.code,
          context,
          {
            productId: product.id,
            movementId: movement.id,
            type: movement.type,
            quantity: Number(movement.quantity),
            stockAfter,
          },
        ),
      })

      return movement
    })
  },
}

export type InventoryMovementRecord = MovementRecord
