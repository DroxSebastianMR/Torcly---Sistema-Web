import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import { computeStock } from '../inventory/inventory.rules.js'
import type { MovementType } from '../inventory/inventory.types.js'
import type { PurchaseFilters, SupplierFilters } from './purchases.types.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUserId(value: string | null) {
  return Boolean(value && uuidPattern.test(value))
}

const supplierSelect = {
  id: true,
  legalName: true,
  documentNumber: true,
  contactName: true,
  phone: true,
  email: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupplierSelect

const purchaseLineSelect = {
  id: true,
  productId: true,
  productCode: true,
  productName: true,
  unitLabel: true,
  quantity: true,
  unitCost: true,
  subtotal: true,
} satisfies Prisma.PurchaseLineSelect

const purchaseSummarySelect = {
  id: true,
  code: true,
  supplierId: true,
  status: true,
  externalRef: true,
  purchaseDate: true,
  total: true,
  performedBy: true,
  receivedBy: true,
  receivedAt: true,
  cancelledBy: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  supplier: {
    select: { id: true, legalName: true, documentNumber: true },
  },
  _count: { select: { lines: true } },
} satisfies Prisma.PurchaseSelect

const purchaseDetailInclude = {
  supplier: {
    select: { id: true, legalName: true, documentNumber: true },
  },
  lines: {
    select: purchaseLineSelect,
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.PurchaseInclude

export type PurchaseDetailRecord = Prisma.PurchaseGetPayload<{
  include: typeof purchaseDetailInclude
}> & { notes?: string | null }

function buildSupplierWhere(
  filters: Pick<SupplierFilters, 'search' | 'active'>,
  organizationId: string,
): Prisma.SupplierWhereInput {
  const search = filters.search?.trim()
  const where: Prisma.SupplierWhereInput = { organizationId }
  if (filters.active === 'true') where.active = true
  if (filters.active === 'false') where.active = false
  if (search) {
    where.OR = [
      { legalName: { contains: search, mode: 'insensitive' } },
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
    ]
  }
  return where
}

function buildPurchaseWhere(
  filters: Omit<PurchaseFilters, 'page' | 'pageSize'>,
  organizationId: string,
): Prisma.PurchaseWhereInput {
  const where: Prisma.PurchaseWhereInput = { organizationId }
  if (filters.supplierId) where.supplierId = filters.supplierId
  if (filters.status !== 'all') where.status = filters.status
  if (filters.from || filters.to) {
    where.purchaseDate = {}
    if (filters.from) where.purchaseDate.gte = new Date(filters.from)
    if (filters.to) where.purchaseDate.lte = new Date(filters.to)
  }
  return where
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
    userId: isUserId(actorId) ? actorId : null,
    organizationId: context.organizationId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

async function lockPurchase(
  transaction: Prisma.TransactionClient,
  purchaseId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:purchase:${purchaseId}`}))`
}

async function lockProduct(
  transaction: Prisma.TransactionClient,
  productId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:inventory:${productId}`}))`
}

export const purchasesRepository = {
  // ── Suppliers ──────────────────────────────────────────
  async listSuppliers(filters: SupplierFilters, organizationId: string) {
    const where = buildSupplierWhere(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.client.supplier.findMany({
        select: supplierSelect,
        where,
        orderBy: { legalName: 'asc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.supplier.count({ where }),
    ])
    return { items, total }
  },

  async listActiveSuppliers(organizationId: string) {
    return databaseService.client.supplier.findMany({
      where: { organizationId, active: true },
      select: { id: true, legalName: true, documentNumber: true },
      orderBy: { legalName: 'asc' },
    })
  },

  findSupplierById(id: string, organizationId: string) {
    return databaseService.client.supplier.findFirst({
      where: { id, organizationId },
      select: supplierSelect,
    })
  },

  findProductRef(id: string, organizationId: string) {
    return databaseService.client.product.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
        unit: { select: { name: true, symbol: true } },
      },
    })
  },

  async createSupplier(
    input: {
      legalName: string
      documentNumber: string
      contactName: string | null
      phone: string | null
      email: string | null
    },
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const supplier = await transaction.supplier.create({
        data: { ...input, organizationId },
        select: supplierSelect,
      })
      await transaction.auditLog.create({
        data: auditData(
          'SUPPLIER_CREATED',
          actor.id,
          supplier.documentNumber,
          context,
          { supplierId: supplier.id, legalName: supplier.legalName },
        ),
      })
      return supplier
    })
  },

  async updateSupplier(
    id: string,
    input: {
      legalName: string
      documentNumber: string
      contactName: string | null
      phone: string | null
      email: string | null
    },
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const existing = await transaction.supplier.findFirst({
        where: { id, organizationId },
        select: { id: true },
      })
      if (!existing) {
        throw new AppError(
          404,
          'SUPPLIER_NOT_FOUND',
          'Proveedor no encontrado.',
        )
      }

      const supplier = await transaction.supplier.update({
        where: { id },
        data: input,
        select: supplierSelect,
      })
      await transaction.auditLog.create({
        data: auditData(
          'SUPPLIER_UPDATED',
          actor.id,
          supplier.documentNumber,
          context,
          { supplierId: supplier.id },
        ),
      })
      return supplier
    })
  },

  async updateSupplierStatus(
    id: string,
    active: boolean,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const existing = await transaction.supplier.findFirst({
        where: { id, organizationId },
        select: { id: true, documentNumber: true },
      })
      if (!existing) {
        throw new AppError(
          404,
          'SUPPLIER_NOT_FOUND',
          'Proveedor no encontrado.',
        )
      }

      const supplier = await transaction.supplier.update({
        where: { id },
        data: { active },
        select: supplierSelect,
      })
      await transaction.auditLog.create({
        data: auditData(
          active ? 'SUPPLIER_ACTIVATED' : 'SUPPLIER_DEACTIVATED',
          actor.id,
          supplier.documentNumber,
          context,
          { supplierId: supplier.id, active },
        ),
      })
      return supplier
    })
  },

  // ── Purchases ──────────────────────────────────────────
  async listPurchases(filters: PurchaseFilters, organizationId: string) {
    const where = buildPurchaseWhere(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.client.purchase.findMany({
        select: purchaseSummarySelect,
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.purchase.count({ where }),
    ])
    return { items, total }
  },

  async findPurchaseById(
    id: string,
    organizationId: string,
  ): Promise<PurchaseDetailRecord | null> {
    return databaseService.client.purchase.findFirst({
      where: { id, organizationId },
      include: purchaseDetailInclude,
    }) as Promise<PurchaseDetailRecord | null>
  },

  async createPurchase(
    input: {
      supplierId: string
      purchaseDate: Date
      externalRef: string | null
      notes: string | null
      lines: Array<{
        productId: string
        quantity: number
        unitCost: number
        subtotal: number
        productName: string
        productCode: string
        unitLabel: string | null
      }>
      total: number
    },
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<PurchaseDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<
        Array<{ seq: number | string }>
      >`SELECT nextval('"purchases_code_seq"') AS seq`
      const code = `COMPRA-${String(Number(rows[0].seq)).padStart(6, '0')}`

      const purchase = await transaction.purchase.create({
        data: {
          organizationId,
          code,
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate,
          externalRef: input.externalRef,
          notes: input.notes,
          total: input.total,
          performedBy: actor.name,
          lines: {
            create: input.lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitCost: line.unitCost,
              subtotal: line.subtotal,
              productName: line.productName,
              productCode: line.productCode,
              unitLabel: line.unitLabel,
            })),
          },
        },
        include: purchaseDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData('PURCHASE_CREATED', actor.id, purchase.code, context, {
          purchaseId: purchase.id,
          code: purchase.code,
          supplierId: input.supplierId,
          lineCount: input.lines.length,
          total: input.total,
        }),
      })

      return purchase as PurchaseDetailRecord
    })
  },

  async updatePurchase(
    id: string,
    input: {
      supplierId: string
      purchaseDate: Date
      externalRef: string | null
      notes: string | null
      lines: Array<{
        productId: string
        quantity: number
        unitCost: number
        subtotal: number
        productName: string
        productCode: string
        unitLabel: string | null
      }>
      total: number
    },
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<PurchaseDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockPurchase(transaction, id)

      const existing = await transaction.purchase.findFirst({
        where: { id, organizationId },
        select: { id: true, status: true, code: true },
      })
      if (!existing) {
        throw new AppError(404, 'PURCHASE_NOT_FOUND', 'Compra no encontrada.')
      }
      if (existing.status !== 'DRAFT') {
        throw new AppError(
          409,
          'PURCHASE_READONLY',
          'Solo se pueden editar compras en borrador.',
        )
      }

      await transaction.purchaseLine.deleteMany({ where: { purchaseId: id } })
      const purchase = await transaction.purchase.update({
        where: { id },
        data: {
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate,
          externalRef: input.externalRef,
          notes: input.notes,
          total: input.total,
          lines: {
            create: input.lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitCost: line.unitCost,
              subtotal: line.subtotal,
              productName: line.productName,
              productCode: line.productCode,
              unitLabel: line.unitLabel,
            })),
          },
        },
        include: purchaseDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData('PURCHASE_UPDATED', actor.id, existing.code, context, {
          purchaseId: id,
          lineCount: input.lines.length,
          total: input.total,
        }),
      })

      return purchase as PurchaseDetailRecord
    })
  },

  async confirmPurchase(
    id: string,
    requestId: string,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<PurchaseDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockPurchase(transaction, id)

      const idempotencyKey = `confirm:${requestId}`
      const byKey = await transaction.purchase.findFirst({
        where: { organizationId, idempotencyKey },
        include: purchaseDetailInclude,
      })
      if (byKey) return byKey as PurchaseDetailRecord

      const purchase = await transaction.purchase.findFirst({
        where: { id, organizationId },
        include: purchaseDetailInclude,
      })
      if (!purchase) {
        throw new AppError(404, 'PURCHASE_NOT_FOUND', 'Compra no encontrada.')
      }

      if (purchase.status === 'RECEIVED') {
        return purchase as PurchaseDetailRecord
      }
      if (purchase.status === 'CANCELLED') {
        throw new AppError(
          409,
          'PURCHASE_CANCELLED',
          'No se puede confirmar una compra cancelada.',
        )
      }

      if (!purchase.lines || purchase.lines.length === 0) {
        throw new AppError(
          400,
          'PURCHASE_NO_LINES',
          'La compra no tiene líneas.',
        )
      }

      for (const line of purchase.lines) {
        await lockProduct(transaction, line.productId)

        const product = await transaction.product.findFirst({
          where: { id: line.productId, organizationId },
          select: { organizationId: true },
        })
        if (!product) {
          throw new AppError(
            404,
            'PRODUCT_NOT_FOUND',
            'Producto no encontrado.',
          )
        }

        await transaction.inventoryMovement.create({
          data: {
            organizationId: product.organizationId,
            productId: line.productId,
            type: 'ENTRY',
            status: 'CONFIRMED',
            quantity: Number(line.quantity),
            idempotencyKey: `purchase-entry:${id}:${line.productId}`,
            notes: `Compra ${purchase.code}`,
            performedBy: actor.name,
            occurredAt: new Date(),
            referenceType: 'purchase',
            referenceId: id,
          },
          select: { id: true, productId: true, type: true, quantity: true },
        })

        const confirmed = await transaction.inventoryMovement.groupBy({
          by: ['type'],
          where: {
            organizationId,
            productId: line.productId,
            status: 'CONFIRMED',
          },
          _sum: { quantity: true },
        })
        const stockAfter = computeStock(
          confirmed.map((m) => ({
            type: m.type as MovementType,
            quantity: m._sum.quantity ?? 0,
          })),
        )

        await transaction.auditLog.create({
          data: auditData(
            'INVENTORY_ENTRY_REGISTERED',
            actor.id,
            line.productCode,
            context,
            {
              productId: line.productId,
              type: 'ENTRY',
              quantity: Number(line.quantity),
              stockAfter,
              purchaseId: id,
              purchaseCode: purchase.code,
            },
          ),
        })
      }

      const updated = await transaction.purchase.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedBy: actor.name,
          receivedAt: new Date(),
          idempotencyKey,
        },
        include: purchaseDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData('PURCHASE_CONFIRMED', actor.id, updated.code, context, {
          purchaseId: updated.id,
          code: updated.code,
          lineCount: updated.lines.length,
          total: Number(updated.total),
          requestId,
        }),
      })

      return updated as PurchaseDetailRecord
    })
  },

  async cancelPurchase(
    id: string,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<PurchaseDetailRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockPurchase(transaction, id)

      const existing = await transaction.purchase.findFirst({
        where: { id, organizationId },
        select: { id: true, status: true, code: true },
      })
      if (!existing) {
        throw new AppError(404, 'PURCHASE_NOT_FOUND', 'Compra no encontrada.')
      }
      if (existing.status === 'RECEIVED') {
        throw new AppError(
          409,
          'PURCHASE_RECEIVED',
          'No se puede cancelar una compra ya recibida.',
        )
      }
      if (existing.status === 'CANCELLED') {
        throw new AppError(
          409,
          'PURCHASE_ALREADY_CANCELLED',
          'Esta compra ya fue cancelada.',
        )
      }

      const updated = await transaction.purchase.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledBy: actor.name,
          cancelledAt: new Date(),
        },
        include: purchaseDetailInclude,
      })

      await transaction.auditLog.create({
        data: auditData(
          'PURCHASE_CANCELLED',
          actor.id,
          existing.code,
          context,
          { purchaseId: id },
        ),
      })

      return updated as PurchaseDetailRecord
    })
  },

  findUserDisplayNames(ids: string[]) {
    return databaseService.client.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, displayName: true },
    })
  },
}
