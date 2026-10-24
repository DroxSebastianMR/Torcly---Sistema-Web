import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  purchasesRepository,
  type PurchaseDetailRecord,
} from './purchases.repository.js'
import type {
  PurchaseDetail,
  PurchaseFilters,
  PurchaseInput,
  PurchaseLineResponse,
  PurchaseSummary,
  PurchaseSupplierRef,
  SupplierFilters,
  SupplierInput,
  SupplierSummary,
} from './purchases.types.js'
import {
  assertHasPurchaseLines,
  computePurchaseTotal,
} from './purchases.rules.js'
import { notificationsService } from '../notifications/notifications.service.js'

function toSupplierSummary(supplier: {
  id: string
  legalName: string
  documentNumber: string
  contactName: string | null
  phone: string | null
  email: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}): SupplierSummary {
  return {
    id: supplier.id,
    legalName: supplier.legalName,
    documentNumber: supplier.documentNumber,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    active: supplier.active,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  }
}

function toSupplierRef(supplier: {
  id: string
  legalName: string
  documentNumber: string
}): PurchaseSupplierRef {
  return {
    id: supplier.id,
    legalName: supplier.legalName,
    documentNumber: supplier.documentNumber,
  }
}

function toLineResponse(line: {
  id: string
  productId: string
  productCode: string
  productName: string
  unitLabel: string | null
  quantity: unknown
  unitCost: unknown
  subtotal: unknown
}): PurchaseLineResponse {
  return {
    id: line.id,
    productId: line.productId,
    productCode: line.productCode,
    productName: line.productName,
    unitLabel: line.unitLabel,
    quantity: Number(line.quantity),
    unitCost: Number(line.unitCost),
    subtotal: Number(line.subtotal),
  }
}

function toSummary(purchase: {
  id: string
  code: string
  supplier: { id: string; legalName: string; documentNumber: string }
  status: PurchaseSummary['status']
  externalRef: string | null
  purchaseDate: Date
  total: unknown
  performedBy: string
  receivedBy: string | null
  receivedAt: Date | null
  cancelledBy: string | null
  cancelledAt: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: { lines: number }
  lines?: unknown[]
}): PurchaseSummary {
  const lineCount = purchase._count?.lines ?? purchase.lines?.length ?? 0
  return {
    id: purchase.id,
    code: purchase.code,
    supplier: toSupplierRef(purchase.supplier),
    status: purchase.status,
    externalRef: purchase.externalRef,
    purchaseDate: purchase.purchaseDate.toISOString().split('T')[0]!,
    total: Number(purchase.total),
    lineCount,
    performedBy: purchase.performedBy,
    receivedBy: purchase.receivedBy,
    receivedAt: purchase.receivedAt ? purchase.receivedAt.toISOString() : null,
    cancelledBy: purchase.cancelledBy,
    cancelledAt: purchase.cancelledAt
      ? purchase.cancelledAt.toISOString()
      : null,
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString(),
  }
}

function toDetail(purchase: PurchaseDetailRecord): PurchaseDetail {
  return {
    ...toSummary(purchase),
    lines: purchase.lines.map(toLineResponse),
    notes: (purchase as { notes?: string | null }).notes ?? null,
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'SUPPLIER_DUPLICATE_DOCUMENT',
        'Ya existe un proveedor con ese número de documento.',
      )
    }
    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'PURCHASE_REFERENCE_INVALID',
        'Uno de los productos ya no está disponible.',
      )
    }
  }
  throw error
}

async function resolveLineInputs(lines: PurchaseInput['lines']) {
  assertHasPurchaseLines(lines)
  return Promise.all(
    lines.map(async (line) => {
      const product = await purchasesRepository.findProductRef(line.productId)

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
      }
      if (!product.active) {
        throw new AppError(
          409,
          'PRODUCT_INACTIVE',
          'El producto está inactivo.',
        )
      }

      const subtotal =
        Math.round(
          (Number(line.quantity) * Number(line.unitCost) + Number.EPSILON) *
            100,
        ) / 100

      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unitLabel: product.unit?.symbol ?? null,
        quantity: line.quantity,
        unitCost: line.unitCost,
        subtotal,
      }
    }),
  )
}

function paginate(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export const purchasesService = {
  // ── Suppliers ──────────────────────────────────────────
  async listSuppliers(filters: SupplierFilters) {
    const result = await purchasesRepository.listSuppliers(filters)
    return {
      data: result.items.map(toSupplierSummary),
      pagination: paginate(result.total, filters.page, filters.pageSize),
    }
  },

  async listActiveSuppliers() {
    const items = await purchasesRepository.listActiveSuppliers()
    return { data: items }
  },

  async getSupplierById(id: string) {
    const supplier = await purchasesRepository.findSupplierById(id)
    if (!supplier) {
      throw new AppError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado.')
    }
    return { data: toSupplierSummary(supplier) }
  },

  async createSupplier(
    input: SupplierInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    try {
      const supplier = await purchasesRepository.createSupplier(
        {
          legalName: input.legalName,
          documentNumber: input.documentNumber,
          contactName: input.contactName ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
        },
        actor,
        context,
      )
      return { data: toSupplierSummary(supplier) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateSupplier(
    id: string,
    input: SupplierInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    try {
      const supplier = await purchasesRepository.updateSupplier(
        id,
        {
          legalName: input.legalName,
          documentNumber: input.documentNumber,
          contactName: input.contactName ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
        },
        actor,
        context,
      )
      return { data: toSupplierSummary(supplier) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateSupplierStatus(
    id: string,
    active: boolean,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const supplier = await purchasesRepository.updateSupplierStatus(
      id,
      active,
      actor,
      context,
    )
    return { data: toSupplierSummary(supplier) }
  },

  // ── Purchases ──────────────────────────────────────────
  async listPurchases(filters: PurchaseFilters) {
    const result = await purchasesRepository.listPurchases(filters)
    return {
      data: result.items.map((p) => toSummary(p)),
      pagination: paginate(result.total, filters.page, filters.pageSize),
    }
  },

  async getPurchaseById(id: string) {
    const purchase = await purchasesRepository.findPurchaseById(id)
    if (!purchase) {
      throw new AppError(404, 'PURCHASE_NOT_FOUND', 'Compra no encontrada.')
    }
    return { data: toDetail(purchase) }
  },

  async createPurchase(
    input: PurchaseInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const supplier = await purchasesRepository.findSupplierById(
      input.supplierId,
    )
    if (!supplier) {
      throw new AppError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado.')
    }
    if (!supplier.active) {
      throw new AppError(
        409,
        'SUPPLIER_INACTIVE',
        'El proveedor está inactivo.',
      )
    }

    const resolvedLines = await resolveLineInputs(input.lines)
    const total = computePurchaseTotal(resolvedLines)

    try {
      const purchase = await purchasesRepository.createPurchase(
        {
          supplierId: input.supplierId,
          purchaseDate: new Date(input.purchaseDate),
          externalRef: input.externalRef ?? null,
          notes: input.notes ?? null,
          lines: resolvedLines,
          total,
        },
        actor,
        context,
      )
      return { data: toDetail(purchase) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updatePurchase(
    id: string,
    input: PurchaseInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const supplier = await purchasesRepository.findSupplierById(
      input.supplierId,
    )
    if (!supplier) {
      throw new AppError(404, 'SUPPLIER_NOT_FOUND', 'Proveedor no encontrado.')
    }
    if (!supplier.active) {
      throw new AppError(
        409,
        'SUPPLIER_INACTIVE',
        'El proveedor está inactivo.',
      )
    }

    const resolvedLines = await resolveLineInputs(input.lines)
    const total = computePurchaseTotal(resolvedLines)

    try {
      const purchase = await purchasesRepository.updatePurchase(
        id,
        {
          supplierId: input.supplierId,
          purchaseDate: new Date(input.purchaseDate),
          externalRef: input.externalRef ?? null,
          notes: input.notes ?? null,
          lines: resolvedLines,
          total,
        },
        actor,
        context,
      )
      return { data: toDetail(purchase) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async confirmPurchase(
    id: string,
    requestId: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const purchase = await purchasesRepository.confirmPurchase(
      id,
      requestId,
      actor,
      context,
    )
    await notificationsService.notifyUsersSafely({
      permission: 'purchases:read',
      type: 'PURCHASE_RECEIVED',
      preferenceKey: 'purchaseReceived',
      title: 'Compra recibida',
      message: `La compra ${purchase.code} ha sido recibida y el inventario actualizado.`,
      link: '/compras',
    })
    return { data: toDetail(purchase) }
  },

  async cancelPurchase(
    id: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const purchase = await purchasesRepository.cancelPurchase(
      id,
      actor,
      context,
    )
    return { data: toDetail(purchase) }
  },
}
