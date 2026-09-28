import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  workOrdersRepository,
  type WorkOrderRecord,
} from './work-order.repository.js'
import { assertHasLines, computeWorkOrderTotals } from './work-order.rules.js'
import type {
  WorkOrderBudgetInput,
  WorkOrderCustomerRef,
  WorkOrderDecisionInput,
  WorkOrderDetail,
  WorkOrderFilters,
  WorkOrderLineInput,
  WorkOrderLineResponse,
  WorkOrderSummary,
  WorkOrderTechnicianInput,
  WorkOrderVehicleRef,
} from './work-order.types.js'

type WorkOrderActor = { id: string; name: string }

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeActor(actor: WorkOrderActor | string): WorkOrderActor {
  return typeof actor === 'string' ? { id: actor, name: actor } : actor
}

function isUserId(value: string | null) {
  return Boolean(value && uuidPattern.test(value))
}

function toCustomerRef(
  customer: WorkOrderRecord['customer'],
): WorkOrderCustomerRef {
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

function toVehicleRef(
  vehicle: WorkOrderRecord['vehicle'],
): WorkOrderVehicleRef {
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
  }
}

function toLineResponse(line: {
  id: string
  type: WorkOrderLineResponse['type']
  productId: string | null
  serviceId: string | null
  name: string
  code: string
  unitLabel: string | null
  unitPrice: unknown
  quantity: unknown
  subtotal: unknown
}): WorkOrderLineResponse {
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
  order: {
    id: string
    code: string
    appointment: { id: string; code: string }
    customer: WorkOrderRecord['customer']
    vehicle: WorkOrderRecord['vehicle']
    status: WorkOrderSummary['status']
    technician: { id: string; displayName: string } | null
    subtotal: unknown
    total: unknown
    performedBy: string
    diagnosisUpdatedBy: string | null
    diagnosisUpdatedAt: Date | null
    budgetSentAt: Date | null
    approvedBy: string | null
    approvedAt: Date | null
    rejectedBy: string | null
    rejectedAt: Date | null
    decisionNotes: string | null
    createdAt: Date
    updatedAt: Date
    _count?: { lines: number }
    lines?: unknown[]
  },
  actorNames = new Map<string, string>(),
): WorkOrderSummary {
  const lineCount = order._count?.lines ?? order.lines?.length ?? 0
  return {
    id: order.id,
    code: order.code,
    appointment: order.appointment,
    customer: toCustomerRef(order.customer),
    vehicle: toVehicleRef(order.vehicle),
    status: order.status,
    technicianId: order.technician?.id ?? null,
    technician: order.technician?.displayName ?? null,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    lineCount,
    performedBy: actorNames.get(order.performedBy) ?? order.performedBy,
    diagnosisUpdatedBy: order.diagnosisUpdatedBy
      ? (actorNames.get(order.diagnosisUpdatedBy) ?? order.diagnosisUpdatedBy)
      : null,
    diagnosisUpdatedAt: order.diagnosisUpdatedAt
      ? order.diagnosisUpdatedAt.toISOString()
      : null,
    budgetSentAt: order.budgetSentAt ? order.budgetSentAt.toISOString() : null,
    approvedBy: order.approvedBy
      ? (actorNames.get(order.approvedBy) ?? order.approvedBy)
      : null,
    approvedAt: order.approvedAt ? order.approvedAt.toISOString() : null,
    rejectedBy: order.rejectedBy
      ? (actorNames.get(order.rejectedBy) ?? order.rejectedBy)
      : null,
    rejectedAt: order.rejectedAt ? order.rejectedAt.toISOString() : null,
    decisionNotes: order.decisionNotes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

function toDetail(
  order: WorkOrderRecord,
  actorNames = new Map<string, string>(),
): WorkOrderDetail {
  return {
    ...toSummary(order, actorNames),
    diagnosis: order.diagnosis,
    lines: order.lines.map(toLineResponse),
  }
}

async function resolveActorNames(
  orders: Array<{
    performedBy: string
    diagnosisUpdatedBy: string | null
    budgetSentBy: string | null
    approvedBy: string | null
    rejectedBy: string | null
  }>,
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(
      orders
        .flatMap((order) => [
          order.performedBy,
          order.diagnosisUpdatedBy,
          order.budgetSentBy,
          order.approvedBy,
          order.rejectedBy,
        ])
        .filter(
          (value): value is string =>
            typeof value === 'string' && isUserId(value),
        ),
    ),
  ]
  if (!ids.length) return new Map<string, string>()

  const users = await workOrdersRepository.findUserDisplayNames(ids)
  return new Map(users.map((user) => [user.id, user.displayName]))
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'WORK_ORDER_REFERENCE_INVALID',
        'Uno de los items seleccionados ya no está disponible.',
      )
    }

    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'WORK_ORDER_DUPLICATE_CODE',
        'Ya existe una orden de taller con ese código.',
      )
    }
  }

  throw error
}

async function resolveLines(
  lines: WorkOrderLineInput[],
): Promise<Prisma.WorkOrderLineCreateManyWorkOrderInput[]> {
  const resolved: Prisma.WorkOrderLineCreateManyWorkOrderInput[] = []
  for (const line of lines) {
    if (line.type === 'PRODUCT' && line.productId) {
      const product = await workOrdersRepository.findProductRef(line.productId)
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
        subtotal: computeWorkOrderTotals([{ unitPrice, quantity }]).total,
      })
      continue
    }

    if (line.type === 'SERVICE' && line.serviceId) {
      const service = await workOrdersRepository.findServiceRef(line.serviceId)
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
      'WORK_ORDER_INVALID_LINE',
      'La línea del presupuesto es inválida.',
    )
  }
  return resolved
}

export const workOrdersService = {
  async list(filters: WorkOrderFilters) {
    const result = await workOrdersRepository.list(filters)
    const actorNames = await resolveActorNames(result.items)
    const stats = await workOrdersRepository.getStats()
    return {
      data: result.items.map((item) => toSummary(item, actorNames)),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      summary: stats,
    }
  },

  async getById(id: string) {
    const order = await workOrdersRepository.findById(id)
    if (!order)
      throw new AppError(
        404,
        'WORK_ORDER_NOT_FOUND',
        'Orden de taller no encontrada.',
      )
    return { data: toDetail(order, await resolveActorNames([order])) }
  },

  async getCatalog() {
    return { data: await workOrdersRepository.getCatalog() }
  },

  async getTechnicians() {
    return { data: await workOrdersRepository.listTechnicians() }
  },

  async createFromAppointment(
    appointmentId: string,
    actor: WorkOrderActor | string,
    context: RequestContext,
  ) {
    const appointment =
      await workOrdersRepository.findAppointmentToAttend(appointmentId)
    if (!appointment)
      throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Cita no encontrada.')

    try {
      const order = await workOrdersRepository.createFromAppointment(
        appointmentId,
        normalizeActor(actor),
        context,
      )
      return { data: toDetail(order) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateDiagnosis(
    id: string,
    diagnosis: string,
    actor: WorkOrderActor | string,
    context: RequestContext,
  ) {
    const order = await workOrdersRepository.updateDiagnosis(
      id,
      diagnosis,
      normalizeActor(actor),
      context,
    )
    return { data: toDetail(order, await resolveActorNames([order])) }
  },

  async saveBudget(
    id: string,
    input: WorkOrderBudgetInput,
    actor: WorkOrderActor | string,
    context: RequestContext,
  ) {
    assertHasLines(input.lines)
    const lines = await resolveLines(input.lines)
    const { subtotal, total } = computeWorkOrderTotals(lines)
    const order = await workOrdersRepository.saveBudget(
      id,
      { lines, subtotal, total },
      normalizeActor(actor),
      context,
    )
    return { data: toDetail(order, await resolveActorNames([order])) }
  },

  async sendBudget(
    id: string,
    actor: WorkOrderActor | string,
    context: RequestContext,
  ) {
    const order = await workOrdersRepository.sendBudget(
      id,
      normalizeActor(actor),
      context,
    )
    return { data: toDetail(order, await resolveActorNames([order])) }
  },

  async decide(
    id: string,
    input: WorkOrderDecisionInput,
    actor: WorkOrderActor | string,
    context: RequestContext,
  ) {
    const order = await workOrdersRepository.decide(
      id,
      input.decision,
      input.notes ?? null,
      normalizeActor(actor),
      context,
    )
    return { data: toDetail(order, await resolveActorNames([order])) }
  },

  async updateTechnician(
    id: string,
    input: WorkOrderTechnicianInput,
    actor: WorkOrderActor | string,
    context: RequestContext,
  ) {
    if (input.technicianId) {
      const technician = await workOrdersRepository.findTechnicianRef(
        input.technicianId,
      )
      if (!technician)
        throw new AppError(
          404,
          'TECHNICIAN_NOT_FOUND',
          'Técnico no encontrado.',
        )
      if (!technician.active)
        throw new AppError(
          409,
          'TECHNICIAN_INACTIVE',
          'El técnico seleccionado está inactivo.',
        )
    }

    const order = await workOrdersRepository.updateTechnician(
      id,
      input.technicianId,
      normalizeActor(actor),
      context,
    )
    return { data: toDetail(order, await resolveActorNames([order])) }
  },
}
