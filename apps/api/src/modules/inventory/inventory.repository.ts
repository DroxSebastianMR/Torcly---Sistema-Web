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

export type InventoryMovementRegistration = {
  movement: MovementRecord
  stockAfter: number | null
  minimumStock: number | null
  lowStock: boolean
  replayed: boolean
}

const auditEventByType: Record<MovementType, AuditEventType> = {
  INITIAL: 'INVENTORY_STOCK_INITIALIZED',
  ENTRY: 'INVENTORY_ENTRY_REGISTERED',
  EXIT: 'INVENTORY_EXIT_REGISTERED',
  ADJUSTMENT_IN: 'INVENTORY_ADJUSTMENT_REGISTERED',
  ADJUSTMENT_OUT: 'INVENTORY_ADJUSTMENT_REGISTERED',
}

export const inventoryRepository = {
  async listExistence(filters: ExistenceFilters) {
    const where = buildExistenceWhere(filters)
    const [products, total] = await Promise.all([
      databaseService.measure('inventory.existence.records', () =>
        databaseService.client.product.findMany({
          select: existenceSelect,
          where,
          orderBy: [{ active: 'desc' }, { name: 'asc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      databaseService.measure('inventory.existence.total', () =>
        databaseService.client.product.count({ where }),
      ),
    ])
    if (!products.length) return { items: [], total }

    const productIds = products.map((product) => product.id)
    const movements = await databaseService.measure(
      'inventory.existence.stock_summary',
      () =>
        databaseService.client.inventoryMovement.groupBy({
          by: ['productId', 'type'],
          where: { productId: { in: productIds } },
          _sum: { quantity: true },
          _max: { occurredAt: true },
        }),
    )
    const grouped = new Map<
      string,
      Array<{ type: MovementType; quantity: unknown }>
    >()
    const lastMovementAt = new Map<string, Date>()
    for (const movement of movements) {
      const list = grouped.get(movement.productId) ?? []
      list.push({
        type: movement.type,
        quantity: movement._sum.quantity ?? 0,
      })
      grouped.set(movement.productId, list)
      const occurredAt = movement._max.occurredAt
      const latest = lastMovementAt.get(movement.productId)
      if (occurredAt && (!latest || occurredAt > latest)) {
        lastMovementAt.set(movement.productId, occurredAt)
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
  },

  listMovements(filters: InventoryMovementFilters) {
    const where = buildMovementWhere(filters)
    return Promise.all([
      databaseService.measure('inventory.history.records', () =>
        databaseService.client.inventoryMovement.findMany({
          select: movementResponseSelect,
          where,
          orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      databaseService.measure('inventory.history.total', () =>
        databaseService.client.inventoryMovement.count({ where }),
      ),
    ]).then(([items, total]) => ({ items, total }))
  },

  findUserDisplayNames(ids: string[]) {
    return databaseService.measure('inventory.history.actors', () =>
      databaseService.client.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, displayName: true },
      }),
    )
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
  ): Promise<InventoryMovementRegistration> {
    const [product, existing] = await Promise.all([
      databaseService.measure('inventory.movement.preflight.product', () =>
        databaseService.client.product.findUnique({
          where: { id: input.productId },
          select: {
            id: true,
            code: true,
            name: true,
            active: true,
            minimumStock: true,
          },
        }),
      ),
      input.idempotencyKey
        ? databaseService.measure(
            'inventory.movement.preflight.idempotency',
            () =>
              databaseService.client.inventoryMovement.findUnique({
                where: { idempotencyKey: input.idempotencyKey },
                select: { ...movementResponseSelect },
              }),
          )
        : Promise.resolve(null),
    ])

    if (!product)
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
    if (!product.active)
      throw new AppError(
        409,
        'PRODUCT_INACTIVE',
        'El producto está inactivo y no admite movimientos.',
      )

    if (existing) {
      if (existing.productId !== input.productId || existing.type !== type)
        throw new AppError(
          409,
          'INVENTORY_IDEMPOTENCY_CONFLICT',
          'La clave de idempotencia ya corresponde a otra operación.',
        )
      return {
        movement: existing,
        stockAfter: null,
        minimumStock: null,
        lowStock: false,
        replayed: true,
      }
    }

    return databaseService.transaction(async (transaction) => {
      await databaseService.measure(
        'inventory.movement.lock',
        () =>
          transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:inventory:${input.productId}`}))`,
      )

      const confirmed = await databaseService.measure(
        'inventory.movement.stock_before',
        () =>
          transaction.inventoryMovement.groupBy({
            by: ['type'],
            where: { productId: input.productId, status: 'CONFIRMED' },
            _sum: { quantity: true },
          }),
      )
      const stockMovements = confirmed.map((movement) => ({
        type: movement.type,
        quantity: movement._sum.quantity ?? 0,
      }))
      const currentStock = computeStock(stockMovements)
      const hasInitialMovement = confirmed.some(
        (movement) => movement.type === 'INITIAL',
      )
      assertCanRegisterMovement({
        type,
        quantity: input.quantity,
        currentStock,
        hasInitialMovement,
      })

      const movement = await databaseService.measure(
        'inventory.movement.create',
        () =>
          transaction.inventoryMovement.create({
            data: {
              productId: input.productId,
              type,
              status: 'CONFIRMED',
              quantity: input.quantity,
              idempotencyKey: input.idempotencyKey || null,
              notes: input.notes || null,
              performedBy: actor.name,
              occurredAt:
                input.occurredAt instanceof Date
                  ? input.occurredAt
                  : new Date(),
              referenceType: input.referenceType || null,
              referenceId: input.referenceId || null,
            },
            select: movementResponseSelect,
          }),
      )

      const stockAfter = computeStock([
        ...stockMovements,
        { type: movement.type, quantity: movement.quantity },
      ])

      await databaseService.measure('inventory.movement.audit', () =>
        transaction.auditLog.create({
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
        }),
      )

      return {
        movement,
        stockAfter,
        minimumStock: Number(product.minimumStock),
        lowStock: stockAfter <= Number(product.minimumStock),
        replayed: false,
      }
    })
  },
}

export type InventoryMovementRecord = MovementRecord
