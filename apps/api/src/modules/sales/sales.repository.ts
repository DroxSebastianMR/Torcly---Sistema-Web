import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { SaleFilters } from './sales.types.js'
import {
  assertCanRegisterMovement,
  computeStock,
} from '../inventory/inventory.rules.js'
import type { MovementType } from '../inventory/inventory.types.js'
import { aggregateProductQuantities, assertHasLines } from './sales.rules.js'

const saleSummarySelect = {
  id: true,
  code: true,
  customerId: true,
  status: true,
  subtotal: true,
  total: true,
  performedBy: true,
  confirmedBy: true,
  confirmedAt: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
    },
  },
  _count: { select: { lines: true } },
} satisfies Prisma.SaleSelect

const saleDetailInclude = {
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
    },
  },
  lines: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.SaleInclude

function buildSaleWhere(
  filters: Pick<SaleFilters, 'search' | 'status'>,
): Prisma.SaleWhereInput {
  const search = filters.search?.trim()
  return {
    ...(filters.status === 'all' ? {} : { status: filters.status }),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            {
              customer: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { legalName: { contains: search, mode: 'insensitive' } },
                  { documentNumber: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          ],
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

async function lockSale(transaction: Prisma.TransactionClient, saleId: string) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:sale:${saleId}`}))`
}

export type SaleDetailRecord = Prisma.SaleGetPayload<{
  include: typeof saleDetailInclude
}>

export const salesRepository = {
  async list(filters: SaleFilters) {
    const where = buildSaleWhere(filters)
    return databaseService.transaction(async (transaction) => {
      const [items, total] = await Promise.all([
        transaction.sale.findMany({
          select: saleSummarySelect,
          where,
          orderBy: { createdAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.sale.count({ where }),
      ])
      return { items, total }
    })
  },

  findById(id: string): Promise<SaleDetailRecord | null> {
    return databaseService.client.sale.findUnique({
      where: { id },
      include: saleDetailInclude,
    })
  },

  findCustomerRef(id: string) {
    return databaseService.client.customer.findUnique({
      where: { id },
      select: {
        id: true,
        documentNumber: true,
        firstName: true,
        lastName: true,
        legalName: true,
      },
    })
  },

  findProductRef(id: string) {
    return databaseService.client.product.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
        salePrice: true,
        unit: { select: { name: true, symbol: true } },
      },
    })
  },

  findServiceRef(id: string) {
    return databaseService.client.service.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
        price: true,
      },
    })
  },

  findUserDisplayNames(ids: string[]) {
    return databaseService.client.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, displayName: true },
    })
  },

  async create(
    input: {
      customerId: string | null
      subtotal: number
      total: number
      lines: Prisma.SaleLineCreateManySaleInput[]
    },
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<SaleDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<
        Array<{ seq: number | string }>
      >`SELECT nextval('"sales_code_seq"') AS seq`
      const code = `VENTA-${String(Number(rows[0].seq)).padStart(6, '0')}`

      const sale = await transaction.sale.create({
        data: {
          code,
          customerId: input.customerId,
          status: 'DRAFT',
          subtotal: input.subtotal,
          total: input.total,
          performedBy: actor.name,
          lines: { create: input.lines },
        },
        include: saleDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData('SALE_CREATED', actor.id, sale.code, context, {
          saleId: sale.id,
          code: sale.code,
          lineCount: sale.lines.length,
          subtotal: Number(sale.subtotal),
          total: Number(sale.total),
        }),
      })

      return sale
    })
  },

  async update(
    id: string,
    input: {
      customerId: string | null
      subtotal: number
      total: number
      lines: Prisma.SaleLineCreateManySaleInput[]
    },
  ): Promise<SaleDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockSale(transaction, id)
      const existing = await transaction.sale.findUnique({
        where: { id },
        select: { id: true, status: true },
      })
      if (!existing)
        throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
      if (existing.status !== 'DRAFT')
        throw new AppError(
          409,
          'SALE_READONLY',
          'Solo se pueden editar ventas en borrador.',
        )

      await transaction.saleLine.deleteMany({ where: { saleId: id } })
      await transaction.saleLine.createMany({
        data: input.lines.map((line) => ({ ...line, saleId: id })),
      })
      await transaction.sale.update({
        where: { id },
        data: {
          customerId: input.customerId,
          subtotal: input.subtotal,
          total: input.total,
        },
      })

      const sale = await transaction.sale.findUnique({
        where: { id },
        include: saleDetailInclude,
      })
      return sale as SaleDetailRecord
    })
  },

  async confirm(
    id: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<SaleDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockSale(transaction, id)

      const sale = await transaction.sale.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              documentNumber: true,
              firstName: true,
              lastName: true,
              legalName: true,
            },
          },
          lines: {
            select: {
              id: true,
              type: true,
              productId: true,
              serviceId: true,
              name: true,
              code: true,
              unitLabel: true,
              unitPrice: true,
              quantity: true,
              subtotal: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      if (!sale)
        throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
      if (sale.status === 'CONFIRMED') return sale as SaleDetailRecord

      assertHasLines(sale.lines)

      const aggregates = aggregateProductQuantities(sale.lines)
      for (const [productId, quantity] of aggregates) {
        const product = await transaction.product.findUnique({
          where: { id: productId },
          select: { id: true, code: true, name: true, active: true },
        })
        if (!product)
          throw new AppError(
            409,
            'PRODUCT_NOT_FOUND',
            'Uno de los productos de la venta ya no existe.',
          )
        if (!product.active)
          throw new AppError(
            409,
            'PRODUCT_INACTIVE',
            'Un producto de la venta está inactivo.',
          )

        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:inventory:${productId}`}))`

        const confirmed = await transaction.inventoryMovement.findMany({
          where: { productId, status: 'CONFIRMED' },
          select: { type: true, quantity: true },
        })
        const currentStock = computeStock(confirmed)
        const hasInitialMovement = confirmed.some(
          (movement) => movement.type === 'INITIAL',
        )
        assertCanRegisterMovement({
          type: 'EXIT',
          quantity,
          currentStock,
          hasInitialMovement,
        })

        const movement = await transaction.inventoryMovement.create({
          data: {
            productId,
            type: 'EXIT',
            status: 'CONFIRMED',
            quantity,
            idempotencyKey: `sale-exit:${id}:${productId}`,
            notes: `Venta ${sale.code}`,
            performedBy: actor.name,
            occurredAt: new Date(),
            referenceType: 'sale',
            referenceId: id,
          },
          select: { id: true, productId: true, type: true, quantity: true },
        })

        const stockAfter = computeStock([
          ...confirmed,
          { type: 'EXIT', quantity: Number(movement.quantity) },
        ])

        await transaction.auditLog.create({
          data: auditData(
            'INVENTORY_EXIT_REGISTERED',
            actor.id,
            product.code,
            context,
            {
              productId,
              movementId: movement.id,
              type: 'EXIT',
              quantity: Number(movement.quantity),
              stockAfter,
              saleId: id,
              saleCode: sale.code,
            },
          ),
        })
      }

      const updated = await transaction.sale.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedBy: actor.name,
          confirmedAt: new Date(),
        },
        include: saleDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData('SALE_CONFIRMED', actor.id, updated.code, context, {
          saleId: updated.id,
          code: updated.code,
          lineCount: updated.lines.length,
          subtotal: Number(updated.subtotal),
          total: Number(updated.total),
        }),
      })

      return updated
    })
  },

  async getCatalog() {
    return databaseService.transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: { active: true },
        select: {
          id: true,
          code: true,
          name: true,
          active: true,
          salePrice: true,
          minimumStock: true,
          unit: { select: { name: true, symbol: true } },
        },
        orderBy: { name: 'asc' },
      })

      let stockByProduct = new Map<string, number>()
      if (products.length) {
        const movements = await transaction.inventoryMovement.findMany({
          where: {
            productId: { in: products.map((product) => product.id) },
            status: 'CONFIRMED',
          },
          select: { productId: true, type: true, quantity: true },
        })
        const grouped = new Map<
          string,
          Array<{ type: MovementType; quantity: unknown }>
        >()
        for (const movement of movements) {
          const list = grouped.get(movement.productId) ?? []
          list.push(movement)
          grouped.set(movement.productId, list)
        }
        stockByProduct = new Map(
          [...grouped.entries()].map(([productId, list]) => [
            productId,
            computeStock(list),
          ]),
        )
      }

      const services = await transaction.service.findMany({
        where: { active: true },
        select: { id: true, code: true, name: true, price: true },
        orderBy: { name: 'asc' },
      })

      return {
        products: products.map((product) => {
          const stock = stockByProduct.get(product.id) ?? 0
          const minimumStock = Number(product.minimumStock)
          return {
            productId: product.id,
            code: product.code,
            name: product.name,
            unit: product.unit,
            active: product.active,
            salePrice: Number(product.salePrice),
            stock,
            lowStock: product.active && stock <= minimumStock,
          }
        }),
        services: services.map((service) => ({
          id: service.id,
          code: service.code,
          name: service.name,
          price: Number(service.price),
        })),
      }
    })
  },
}
