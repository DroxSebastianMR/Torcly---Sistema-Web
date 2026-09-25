import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import { salesRepository, type SaleDetailRecord } from './sales.repository.js'
import { assertHasLines, computeSaleTotals } from './sales.rules.js'
import type {
  SaleCatalog,
  SaleDetail,
  SaleFilters,
  SaleInput,
  SaleLineInput,
  SaleLineResponse,
  SaleSummary,
} from './sales.types.js'

type CustomerRefRecord =
  | {
      id: string
      documentNumber: string
      firstName: string | null
      lastName: string | null
      legalName: string | null
    }
  | null
  | undefined

type SaleActor = { id: string; name: string }

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeActor(actor: SaleActor | string): SaleActor {
  return typeof actor === 'string' ? { id: actor, name: actor } : actor
}

function isUserId(value: string | null) {
  return Boolean(value && uuidPattern.test(value))
}

function toCustomerRef(customer: CustomerRefRecord) {
  if (!customer) return null
  const name =
    (customer.legalName ??
      [customer.firstName, customer.lastName].filter(Boolean).join(' ')) ||
    'Sin nombre'
  return {
    id: customer.id,
    documentNumber: customer.documentNumber,
    name,
  }
}

function toLineResponse(line: {
  id: string
  type: SaleLineResponse['type']
  productId: string | null
  serviceId: string | null
  name: string
  code: string
  unitLabel: string | null
  unitPrice: unknown
  quantity: unknown
  subtotal: unknown
}): SaleLineResponse {
  return {
    id: line.id,
    type: line.type,
    productId: line.productId,
    serviceId: line.serviceId,
    name: line.name,
    code: line.code,
    unitLabel: line.unitLabel,
    unitPrice: Number(line.unitPrice),
    quantity: Number(line.quantity),
    subtotal: Number(line.subtotal),
  }
}

function toSummary(
  sale: {
    id: string
    code: string
    customer: CustomerRefRecord
    status: SaleSummary['status']
    subtotal: unknown
    total: unknown
    performedBy: string
    confirmedBy: string | null
    confirmedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count?: { lines: number }
    lines?: unknown[]
  },
  actorNames = new Map<string, string>(),
): SaleSummary {
  const lineCount = sale._count?.lines ?? sale.lines?.length ?? 0
  return {
    id: sale.id,
    code: sale.code,
    customer: toCustomerRef(sale.customer),
    status: sale.status,
    subtotal: Number(sale.subtotal),
    total: Number(sale.total),
    lineCount,
    performedBy: actorNames.get(sale.performedBy) ?? sale.performedBy,
    confirmedBy: sale.confirmedBy
      ? (actorNames.get(sale.confirmedBy) ?? sale.confirmedBy)
      : null,
    confirmedAt: sale.confirmedAt ? sale.confirmedAt.toISOString() : null,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  }
}

function toDetail(
  sale: SaleDetailRecord,
  actorNames = new Map<string, string>(),
): SaleDetail {
  return {
    ...toSummary(sale, actorNames),
    lines: sale.lines.map(toLineResponse),
  }
}

async function resolveActorNames(
  sales: Array<{ performedBy: string; confirmedBy: string | null }>,
) {
  const ids = [
    ...new Set(
      sales
        .flatMap((sale) => [sale.performedBy, sale.confirmedBy])
        .filter(
          (value): value is string =>
            typeof value === 'string' && isUserId(value),
        ),
    ),
  ]
  if (!ids.length) return new Map<string, string>()

  const users = await salesRepository.findUserDisplayNames(ids)
  return new Map(users.map((user) => [user.id, user.displayName]))
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'SALE_REFERENCE_INVALID',
        'Uno de los items de la venta ya no está disponible.',
      )
    }

    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'SALE_DUPLICATE_CODE',
        'Ya existe una venta con ese código.',
      )
    }
  }

  throw error
}

async function resolveLines(
  lines: SaleLineInput[],
): Promise<Prisma.SaleLineCreateManySaleInput[]> {
  const resolved: Prisma.SaleLineCreateManySaleInput[] = []
  for (const line of lines) {
    if (line.type === 'PRODUCT' && line.productId) {
      const product = await salesRepository.findProductRef(line.productId)
      if (!product)
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
      if (!product.active)
        throw new AppError(
          409,
          'PRODUCT_INACTIVE',
          'El producto está inactivo.',
        )
      const unitPrice = Number(product.salePrice)
      const quantity = line.quantity ?? 1
      resolved.push({
        type: 'PRODUCT',
        productId: product.id,
        name: product.name,
        code: product.code,
        unitLabel: product.unit.symbol,
        unitPrice,
        quantity,
        subtotal: roundLineSubtotal(unitPrice, quantity),
      })
      continue
    }

    if (line.type === 'SERVICE' && line.serviceId) {
      const service = await salesRepository.findServiceRef(line.serviceId)
      if (!service)
        throw new AppError(404, 'SERVICE_NOT_FOUND', 'Servicio no encontrado.')
      if (!service.active)
        throw new AppError(
          409,
          'SERVICE_INACTIVE',
          'El servicio está inactivo.',
        )
      const unitPrice = Number(service.price)
      resolved.push({
        type: 'SERVICE',
        serviceId: service.id,
        name: service.name,
        code: service.code,
        unitLabel: null,
        unitPrice,
        quantity: 1,
        subtotal: unitPrice,
      })
      continue
    }

    throw new AppError(
      400,
      'SALE_INVALID_LINE',
      'La línea de venta es inválida.',
    )
  }
  return resolved
}

function roundLineSubtotal(unitPrice: number, quantity: number): number {
  return computeSaleTotals([{ unitPrice, quantity }]).total
}

export const salesService = {
  async list(filters: SaleFilters) {
    const result = await salesRepository.list(filters)
    const actorNames = await resolveActorNames(result.items)
    return {
      data: result.items.map((sale) => toSummary(sale, actorNames)),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },

  async getById(id: string) {
    const sale = await salesRepository.findById(id)
    if (!sale) throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
    return { data: toDetail(sale, await resolveActorNames([sale])) }
  },

  async getCatalog(): Promise<{ data: SaleCatalog }> {
    return { data: await salesRepository.getCatalog() }
  },

  async create(
    input: SaleInput,
    actor: SaleActor | string,
    context: RequestContext,
  ) {
    const customerId = input.customerId ?? null
    if (customerId) {
      const customer = await salesRepository.findCustomerRef(customerId)
      if (!customer)
        throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')
    }

    assertHasLines(input.lines)
    const lines = await resolveLines(input.lines)
    const { subtotal, total } = computeSaleTotals(lines)
    const normalizedActor = normalizeActor(actor)

    try {
      const sale = await salesRepository.create(
        { customerId, subtotal, total, lines },
        normalizedActor,
        context,
      )
      return { data: toDetail(sale) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async update(
    id: string,
    input: SaleInput,
    _actorId: string,
    _context: RequestContext,
  ) {
    const customerId = input.customerId ?? null
    if (customerId) {
      const customer = await salesRepository.findCustomerRef(customerId)
      if (!customer)
        throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')
    }

    assertHasLines(input.lines)
    const lines = await resolveLines(input.lines)
    const { subtotal, total } = computeSaleTotals(lines)

    try {
      const sale = await salesRepository.update(id, {
        customerId,
        subtotal,
        total,
        lines,
      })
      return { data: toDetail(sale) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async confirm(
    id: string,
    actor: SaleActor | string,
    context: RequestContext,
  ) {
    const normalizedActor = normalizeActor(actor)
    const sale = await salesRepository.confirm(id, normalizedActor, context)
    return { data: toDetail(sale) }
  },
}
