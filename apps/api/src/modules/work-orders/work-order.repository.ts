import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import {
  assertCanRegisterMovement,
  computeStock,
} from '../inventory/inventory.rules.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  assertAppointmentAttendable,
  assertBudgetEditable,
  assertCanCompleteActivity,
  assertCanConsume,
  assertCanDecide,
  assertCanDeliver,
  assertCanFinalize,
  assertCanRegisterActivity,
  assertCanReturn,
  assertCanStartExecution,
  assertHasLines,
  assertTechnicianEditable,
  computeNetConsumed,
  roundQuantity,
  shouldMoveToDiagnosis,
} from './work-order.rules.js'
import type {
  WorkOrderConsumptionType,
  WorkOrderFilters,
} from './work-order.types.js'

const workOrderSummarySelect = {
  id: true,
  code: true,
  appointmentId: true,
  status: true,
  technicianId: true,
  subtotal: true,
  total: true,
  performedBy: true,
  diagnosisUpdatedBy: true,
  diagnosisUpdatedAt: true,
  budgetSentBy: true,
  budgetSentAt: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  decisionNotes: true,
  executionStartedBy: true,
  executionStartedAt: true,
  readyForDeliveryAt: true,
  deliveredBy: true,
  deliveredAt: true,
  deliveryNotes: true,
  createdAt: true,
  updatedAt: true,
  appointment: {
    select: { id: true, code: true },
  },
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      year: true,
    },
  },
  technician: {
    select: { id: true, displayName: true },
  },
  _count: { select: { lines: true } },
} satisfies Prisma.WorkOrderSelect

const workOrderDetailInclude = {
  appointment: {
    select: { id: true, code: true },
  },
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      year: true,
    },
  },
  technician: {
    select: { id: true, displayName: true },
  },
  lines: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.WorkOrderInclude

export type WorkOrderRecord = Prisma.WorkOrderGetPayload<{
  include: typeof workOrderDetailInclude
}>

type WorkOrderOrderRow = Prisma.WorkOrderGetPayload<{
  select: { id: true; code: true; status: true }
}>

const workOrderExecutionSelect = {
  id: true,
  code: true,
  status: true,
  executionStartedBy: true,
  executionStartedAt: true,
  readyForDeliveryAt: true,
  deliveredBy: true,
  deliveredAt: true,
  deliveryNotes: true,
  lines: {
    where: { type: 'PRODUCT' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      productId: true,
      name: true,
      code: true,
      unitLabel: true,
      quantity: true,
    },
  },
  activities: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      description: true,
      performedBy: true,
      occurredAt: true,
      completedBy: true,
      completedAt: true,
      createdAt: true,
    },
  },
  consumptions: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      type: true,
      workOrderLineId: true,
      productId: true,
      quantity: true,
      notes: true,
      performedBy: true,
      occurredAt: true,
    },
  },
} satisfies Prisma.WorkOrderSelect

export type WorkOrderExecutionRecord = Prisma.WorkOrderGetPayload<{
  select: typeof workOrderExecutionSelect
}>

export interface WorkOrderMovementRegistration {
  consumptionId: string
  movementId: string
  productId: string
  quantity: number
}

export interface WorkOrderConsumeResult {
  order: WorkOrderRecord
  registrations: WorkOrderMovementRegistration[]
}

function buildWhere(filters: WorkOrderFilters): Prisma.WorkOrderWhereInput {
  const search = filters.search?.trim()
  return {
    ...(filters.status === 'all' ? {} : { status: filters.status }),
    ...(filters.technicianId ? { technicianId: filters.technicianId } : {}),
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
            {
              vehicle: {
                OR: [
                  { plate: { contains: search, mode: 'insensitive' } },
                  { brand: { contains: search, mode: 'insensitive' } },
                  { model: { contains: search, mode: 'insensitive' } },
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

async function lockOrder(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:work-order:${orderId}`}))`
}

async function lockAppointment(
  transaction: Prisma.TransactionClient,
  appointmentId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:appointment:${appointmentId}`}))`
}

async function requireOrder(
  transaction: Prisma.TransactionClient,
  orderId: string,
): Promise<WorkOrderOrderRow> {
  const order = await transaction.workOrder.findUnique({
    where: { id: orderId },
    select: { id: true, code: true, status: true },
  })
  if (!order)
    throw new AppError(
      404,
      'WORK_ORDER_NOT_FOUND',
      'Orden de taller no encontrada.',
    )
  return order
}

export const workOrdersRepository = {
  async list(filters: WorkOrderFilters) {
    const where = buildWhere(filters)
    return databaseService.transaction(async (transaction) => {
      const [items, total] = await Promise.all([
        transaction.workOrder.findMany({
          select: workOrderSummarySelect,
          where,
          orderBy: { createdAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.workOrder.count({ where }),
      ])
      return { items, total }
    })
  },

  findById(id: string): Promise<WorkOrderRecord | null> {
    return databaseService.client.workOrder.findUnique({
      where: { id },
      include: workOrderDetailInclude,
    })
  },

  findAppointmentToAttend(appointmentId: string) {
    return databaseService.client.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        code: true,
        status: true,
        customerId: true,
        vehicleId: true,
        customer: {
          select: {
            id: true,
            documentNumber: true,
            firstName: true,
            lastName: true,
            legalName: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            year: true,
          },
        },
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

  findTechnicianRef(id: string) {
    return databaseService.client.user.findUnique({
      where: { id },
      select: { id: true, active: true, displayName: true },
    })
  },

  findUserDisplayNames(ids: string[]) {
    return databaseService.client.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, displayName: true },
    })
  },

  async getStats() {
    return databaseService.transaction(async (transaction) => {
      const [
        total,
        recepcionadas,
        enDiagnostico,
        pendientesAprobacion,
        aprobadas,
        rechazadas,
        enEjecucion,
        listasParaEntrega,
        entregadas,
      ] = await Promise.all([
        transaction.workOrder.count(),
        transaction.workOrder.count({ where: { status: 'RECEPCIONADA' } }),
        transaction.workOrder.count({ where: { status: 'EN_DIAGNOSTICO' } }),
        transaction.workOrder.count({
          where: { status: 'PENDIENTE_APROBACION' },
        }),
        transaction.workOrder.count({ where: { status: 'APROBADA' } }),
        transaction.workOrder.count({ where: { status: 'RECHAZADA' } }),
        transaction.workOrder.count({ where: { status: 'EN_EJECUCION' } }),
        transaction.workOrder.count({
          where: { status: 'LISTA_PARA_ENTREGA' },
        }),
        transaction.workOrder.count({ where: { status: 'ENTREGADA' } }),
      ])
      return {
        total,
        recepcionadas,
        enDiagnostico,
        pendientesAprobacion,
        aprobadas,
        rechazadas,
        enEjecucion,
        listasParaEntrega,
        entregadas,
      }
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
          salePrice: true,
          unit: { select: { name: true, symbol: true } },
        },
        orderBy: { name: 'asc' },
      })
      const services = await transaction.service.findMany({
        where: { active: true },
        select: { id: true, code: true, name: true, price: true },
        orderBy: { name: 'asc' },
      })
      return {
        products: products.map((product) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          unit: product.unit,
          salePrice: Number(product.salePrice),
        })),
        services: services.map((service) => ({
          id: service.id,
          code: service.code,
          name: service.name,
          price: Number(service.price),
        })),
      }
    })
  },

  listTechnicians() {
    return databaseService.client.user.findMany({
      where: { active: true },
      select: { id: true, displayName: true },
      orderBy: { displayName: 'asc' },
    })
  },

  async createFromAppointment(
    appointmentId: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockAppointment(transaction, appointmentId)

      const appointment = await transaction.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          code: true,
          status: true,
          customerId: true,
          vehicleId: true,
          customer: {
            select: {
              id: true,
              documentNumber: true,
              firstName: true,
              lastName: true,
              legalName: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plate: true,
              brand: true,
              model: true,
              year: true,
            },
          },
        },
      })
      if (!appointment)
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Cita no encontrada.')
      assertAppointmentAttendable(appointment)

      const existing = await transaction.workOrder.findUnique({
        where: { appointmentId },
        select: { id: true, code: true },
      })
      if (existing)
        throw new AppError(
          409,
          'WORK_ORDER_ALREADY_EXISTS',
          `La cita ya generó la orden de taller ${existing.code}.`,
        )

      const rows = await transaction.$queryRaw<
        Array<{ seq: number | string }>
      >`SELECT nextval('"work_orders_code_seq"') AS seq`
      const code = `OT-${String(Number(rows[0].seq)).padStart(6, '0')}`

      const workOrder = await transaction.workOrder.create({
        data: {
          code,
          appointmentId: appointment.id,
          customerId: appointment.customerId,
          vehicleId: appointment.vehicleId,
          status: 'RECEPCIONADA',
          performedBy: actor.name,
        },
        include: workOrderDetailInclude,
      })

      await transaction.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'ATENDIDA',
          attendedBy: actor.name,
          attendedAt: new Date(),
        },
      })

      await transaction.auditLog.create({
        data: auditData(
          'APPOINTMENT_ATTENDED',
          actor.id,
          appointment.code,
          context,
          {
            appointmentId: appointment.id,
            code: appointment.code,
            workOrderId: workOrder.id,
            workOrderCode: workOrder.code,
          },
        ),
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_CREATED',
          actor.id,
          workOrder.code,
          context,
          {
            workOrderId: workOrder.id,
            code: workOrder.code,
            appointmentId: appointment.id,
            appointmentCode: appointment.code,
            customerId: workOrder.customerId,
            vehicleId: workOrder.vehicleId,
          },
        ),
      })

      return workOrder
    })
  },

  async updateDiagnosis(
    id: string,
    diagnosis: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, id)
      const order = await requireOrder(transaction, id)
      assertBudgetEditable(order)

      const nextStatus = shouldMoveToDiagnosis(order.status)
      await transaction.workOrder.update({
        where: { id },
        data: {
          diagnosis,
          diagnosisUpdatedBy: actor.name,
          diagnosisUpdatedAt: new Date(),
          ...(nextStatus === order.status ? {} : { status: nextStatus }),
        },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_DIAGNOSIS_UPDATED',
          actor.id,
          order.code,
          context,
          {
            workOrderId: id,
            code: order.code,
            status: nextStatus,
          },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async saveBudget(
    orderId: string,
    input: {
      lines: Prisma.WorkOrderLineCreateManyWorkOrderInput[]
      subtotal: number
      total: number
    },
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertBudgetEditable(order)

      await transaction.workOrderLine.deleteMany({
        where: { workOrderId: orderId },
      })
      await transaction.workOrderLine.createMany({
        data: input.lines.map((line) => ({ ...line, workOrderId: orderId })),
      })
      await transaction.workOrder.update({
        where: { id: orderId },
        data: { subtotal: input.subtotal, total: input.total },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_BUDGET_SAVED',
          actor.id,
          order.code,
          context,
          {
            workOrderId: orderId,
            code: order.code,
            lineCount: input.lines.length,
            subtotal: input.subtotal,
            total: input.total,
          },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async sendBudget(
    orderId: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertBudgetEditable(order)

      const lineCount = await transaction.workOrderLine.count({
        where: { workOrderId: orderId },
      })
      assertHasLines(new Array(lineCount))

      await transaction.workOrder.update({
        where: { id: orderId },
        data: {
          status: 'PENDIENTE_APROBACION',
          budgetSentBy: actor.name,
          budgetSentAt: new Date(),
        },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_BUDGET_SENT',
          actor.id,
          order.code,
          context,
          {
            workOrderId: orderId,
            code: order.code,
            lineCount,
          },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async decide(
    orderId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes: string | null,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await transaction.workOrder.findUnique({
        where: { id: orderId },
        select: { id: true, code: true, status: true, budgetSentAt: true },
      })
      if (!order)
        throw new AppError(
          404,
          'WORK_ORDER_NOT_FOUND',
          'Orden de taller no encontrada.',
        )
      assertCanDecide(order)

      await transaction.workOrder.update({
        where: { id: orderId },
        data: {
          status: decision === 'APPROVED' ? 'APROBADA' : 'RECHAZADA',
          approvedBy: decision === 'APPROVED' ? actor.name : null,
          approvedAt: decision === 'APPROVED' ? new Date() : null,
          rejectedBy: decision === 'REJECTED' ? actor.name : null,
          rejectedAt: decision === 'REJECTED' ? new Date() : null,
          decisionNotes: notes,
        },
      })
      await transaction.auditLog.create({
        data: auditData(
          decision === 'APPROVED'
            ? 'WORK_ORDER_BUDGET_APPROVED'
            : 'WORK_ORDER_BUDGET_REJECTED',
          actor.id,
          order.code,
          context,
          {
            workOrderId: orderId,
            code: order.code,
            notes: notes ?? undefined,
          },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async updateTechnician(
    orderId: string,
    technicianId: string | null,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertTechnicianEditable(order)

      await transaction.workOrder.update({
        where: { id: orderId },
        data: { technicianId },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_TECHNICIAN_ASSIGNED',
          actor.id,
          order.code,
          context,
          {
            workOrderId: orderId,
            code: order.code,
            technicianId: technicianId ?? undefined,
          },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async startExecution(
    orderId: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await transaction.workOrder.findUnique({
        where: { id: orderId },
        select: { id: true, code: true, status: true, technicianId: true },
      })
      if (!order)
        throw new AppError(
          404,
          'WORK_ORDER_NOT_FOUND',
          'Orden de taller no encontrada.',
        )
      assertCanStartExecution(order)

      await transaction.workOrder.update({
        where: { id: orderId },
        data: {
          status: 'EN_EJECUCION',
          executionStartedBy: actor.name,
          executionStartedAt: new Date(),
        },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_EXECUTION_STARTED',
          actor.id,
          order.code,
          context,
          { workOrderId: orderId, code: order.code },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async addActivity(
    orderId: string,
    input: { description: string; occurredAt?: string },
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const occurredAt = input.occurredAt
      ? new Date(`${input.occurredAt}T00:00:00.000Z`)
      : new Date()
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertCanRegisterActivity(order)

      const activity = await transaction.workOrderActivity.create({
        data: {
          workOrderId: orderId,
          description: input.description,
          performedBy: actor.name,
          occurredAt,
        },
        select: {
          id: true,
          status: true,
          description: true,
          performedBy: true,
          occurredAt: true,
          completedBy: true,
          completedAt: true,
          createdAt: true,
        },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_ACTIVITY_CREATED',
          actor.id,
          order.code,
          context,
          {
            workOrderId: orderId,
            code: order.code,
            activityId: activity.id,
          },
        ),
      })
      return activity
    })
  },

  async completeActivity(
    orderId: string,
    activityId: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertCanCompleteActivity(order)

      const activity = await transaction.workOrderActivity.findFirst({
        where: { id: activityId, workOrderId: orderId },
        select: {
          id: true,
          status: true,
          description: true,
          performedBy: true,
          occurredAt: true,
          completedBy: true,
          completedAt: true,
          createdAt: true,
        },
      })
      if (!activity)
        throw new AppError(
          404,
          'WORK_ORDER_ACTIVITY_NOT_FOUND',
          'Actividad no encontrada en la orden.',
        )
      if (activity.status === 'COMPLETADA') return activity

      const updated = await transaction.workOrderActivity.update({
        where: { id: activityId },
        data: {
          status: 'COMPLETADA',
          completedBy: actor.name,
          completedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          description: true,
          performedBy: true,
          occurredAt: true,
          completedBy: true,
          completedAt: true,
          createdAt: true,
        },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_ACTIVITY_COMPLETED',
          actor.id,
          order.code,
          context,
          {
            workOrderId: orderId,
            code: order.code,
            activityId,
          },
        ),
      })
      return updated
    })
  },

  async consume(
    orderId: string,
    input: {
      requestId: string
      items: Array<{ lineId: string; quantity: number }>
    },
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderConsumeResult> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await transaction.workOrder.findUnique({
        where: { id: orderId },
        select: { id: true, code: true, status: true },
      })
      if (!order)
        throw new AppError(
          404,
          'WORK_ORDER_NOT_FOUND',
          'Orden de taller no encontrada.',
        )
      assertCanConsume(order)

      const lines = await transaction.workOrderLine.findMany({
        where: { workOrderId: orderId, type: 'PRODUCT' },
        select: { id: true, productId: true, quantity: true },
      })
      const productIds = [
        ...new Set(
          lines
            .map((line) => line.productId)
            .filter((productId): productId is string => Boolean(productId)),
        ),
      ]
      const products = productIds.length
        ? await transaction.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, code: true, active: true },
          })
        : []
      const productById = new Map(
        products.map((product) => [product.id, product]),
      )
      const existingRecords = await transaction.workOrderConsumption.findMany({
        where: { workOrderId: orderId },
        select: { workOrderLineId: true, type: true, quantity: true },
      })
      const existing: Array<{
        workOrderLineId: string
        type: WorkOrderConsumptionType
        quantity: number
      }> = existingRecords.map((record) => ({
        workOrderLineId: record.workOrderLineId,
        type: record.type,
        quantity: Number(record.quantity),
      }))

      const registrations: WorkOrderMovementRegistration[] = []
      for (const item of input.items) {
        const line = lines.find((candidate) => candidate.id === item.lineId)
        if (!line?.productId)
          throw new AppError(
            400,
            'WORK_ORDER_LINE_NOT_CONSUMABLE',
            'El repuesto seleccionado no pertenece a las líneas de producto del presupuesto.',
          )
        const productId = line.productId
        const product = productById.get(productId)
        if (!product)
          throw new AppError(
            404,
            'PRODUCT_NOT_FOUND',
            'Producto no encontrado.',
          )
        if (!product.active)
          throw new AppError(
            409,
            'PRODUCT_INACTIVE',
            'El producto está inactivo.',
          )

        const netConsumed = computeNetConsumed(
          existing.filter(
            (consumption) => consumption.workOrderLineId === line.id,
          ),
        )
        const pending = roundQuantity(Number(line.quantity) - netConsumed)
        const quantity = roundQuantity(item.quantity)
        if (quantity > pending)
          throw new AppError(
            409,
            'WORK_ORDER_QUANTITY_EXCEEDS_BUDGET',
            `El consumo no puede superar lo presupuestado: quedan ${pending} disponibles y se solicitan ${quantity}.`,
          )

        const idempotencyKey = `work-order:consume:${orderId}:${line.id}:${input.requestId}`
        const replay = await transaction.workOrderConsumption.findUnique({
          where: { idempotencyKey },
          select: { workOrderLineId: true },
        })
        if (replay) {
          if (replay.workOrderLineId !== line.id)
            throw new AppError(
              409,
              'WORK_ORDER_CONFLICT',
              'El identificador de la operación ya fue utilizado en la orden.',
            )
          continue
        }

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
            idempotencyKey: `work-order-consume:${orderId}:${productId}:${input.requestId}`,
            notes: `Consumo en ${order.code}`,
            performedBy: actor.name,
            occurredAt: new Date(),
            referenceType: 'work-order',
            referenceId: orderId,
          },
          select: { id: true, quantity: true },
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
              workOrderId: orderId,
              workOrderCode: order.code,
            },
          ),
        })

        const consumption = await transaction.workOrderConsumption.create({
          data: {
            workOrderId: orderId,
            workOrderLineId: line.id,
            productId,
            type: 'CONSUMPTION',
            quantity,
            idempotencyKey,
            movementId: movement.id,
            performedBy: actor.name,
            occurredAt: new Date(),
          },
          select: { id: true },
        })
        await transaction.auditLog.create({
          data: auditData(
            'WORK_ORDER_PRODUCT_CONSUMED',
            actor.id,
            order.code,
            context,
            {
              workOrderId: orderId,
              code: order.code,
              workOrderLineId: line.id,
              productId,
              consumptionId: consumption.id,
              movementId: movement.id,
              quantity,
              netConsumed: roundQuantity(netConsumed + quantity),
            },
          ),
        })

        registrations.push({
          consumptionId: consumption.id,
          movementId: movement.id,
          productId,
          quantity: Number(movement.quantity),
        })
        existing.push({
          workOrderLineId: line.id,
          type: 'CONSUMPTION',
          quantity,
        })
      }

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return { order: workOrder as WorkOrderRecord, registrations }
    })
  },

  async returnProducts(
    orderId: string,
    input: {
      requestId: string
      items: Array<{ lineId: string; quantity: number; notes?: string }>
    },
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderConsumeResult> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await transaction.workOrder.findUnique({
        where: { id: orderId },
        select: { id: true, code: true, status: true },
      })
      if (!order)
        throw new AppError(
          404,
          'WORK_ORDER_NOT_FOUND',
          'Orden de taller no encontrada.',
        )
      assertCanReturn(order)

      const lines = await transaction.workOrderLine.findMany({
        where: { workOrderId: orderId, type: 'PRODUCT' },
        select: { id: true, productId: true, quantity: true },
      })
      const productIds = [
        ...new Set(
          lines
            .map((line) => line.productId)
            .filter((productId): productId is string => Boolean(productId)),
        ),
      ]
      const products = productIds.length
        ? await transaction.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, code: true, active: true },
          })
        : []
      const productById = new Map(
        products.map((product) => [product.id, product]),
      )
      const existingRecords = await transaction.workOrderConsumption.findMany({
        where: { workOrderId: orderId },
        select: { workOrderLineId: true, type: true, quantity: true },
      })
      const existing: Array<{
        workOrderLineId: string
        type: WorkOrderConsumptionType
        quantity: number
      }> = existingRecords.map((record) => ({
        workOrderLineId: record.workOrderLineId,
        type: record.type,
        quantity: Number(record.quantity),
      }))

      const registrations: WorkOrderMovementRegistration[] = []
      for (const item of input.items) {
        const line = lines.find((candidate) => candidate.id === item.lineId)
        if (!line?.productId)
          throw new AppError(
            400,
            'WORK_ORDER_LINE_NOT_CONSUMABLE',
            'El repuesto seleccionado no pertenece a las líneas de producto del presupuesto.',
          )
        const productId = line.productId
        const product = productById.get(productId)
        if (!product)
          throw new AppError(
            404,
            'PRODUCT_NOT_FOUND',
            'Producto no encontrado.',
          )
        if (!product.active)
          throw new AppError(
            409,
            'PRODUCT_INACTIVE',
            'El producto está inactivo.',
          )

        const netConsumed = computeNetConsumed(
          existing.filter(
            (consumption) => consumption.workOrderLineId === line.id,
          ),
        )
        const quantity = roundQuantity(item.quantity)
        if (quantity > netConsumed)
          throw new AppError(
            409,
            'WORK_ORDER_RETURN_EXCEEDS_CONSUMED',
            `La devolución no puede superar el neto consumido de la línea: se han consumido ${netConsumed} y se devuelven ${quantity}.`,
          )

        const idempotencyKey = `work-order:return:${orderId}:${line.id}:${input.requestId}`
        const replay = await transaction.workOrderConsumption.findUnique({
          where: { idempotencyKey },
          select: { workOrderLineId: true },
        })
        if (replay) {
          if (replay.workOrderLineId !== line.id)
            throw new AppError(
              409,
              'WORK_ORDER_CONFLICT',
              'El identificador de la operación ya fue utilizado en la orden.',
            )
          continue
        }

        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:inventory:${productId}`}))`

        const confirmed = await transaction.inventoryMovement.findMany({
          where: { productId, status: 'CONFIRMED' },
          select: { type: true, quantity: true },
        })
        const stockBefore = computeStock(confirmed)
        const movement = await transaction.inventoryMovement.create({
          data: {
            productId,
            type: 'ADJUSTMENT_IN',
            status: 'CONFIRMED',
            quantity,
            idempotencyKey: `work-order-return:${orderId}:${productId}:${input.requestId}`,
            notes: `Devolución en ${order.code}`,
            performedBy: actor.name,
            occurredAt: new Date(),
            referenceType: 'work-order',
            referenceId: orderId,
          },
          select: { id: true, quantity: true },
        })

        const stockAfter = computeStock([
          ...confirmed,
          { type: 'ADJUSTMENT_IN', quantity: Number(movement.quantity) },
        ])
        await transaction.auditLog.create({
          data: auditData(
            'INVENTORY_ADJUSTMENT_REGISTERED',
            actor.id,
            product.code,
            context,
            {
              productId,
              movementId: movement.id,
              type: 'ADJUSTMENT_IN',
              quantity: Number(movement.quantity),
              stockBefore,
              stockAfter,
              workOrderId: orderId,
              workOrderCode: order.code,
            },
          ),
        })

        const consumption = await transaction.workOrderConsumption.create({
          data: {
            workOrderId: orderId,
            workOrderLineId: line.id,
            productId,
            type: 'RETURN',
            quantity,
            idempotencyKey,
            movementId: movement.id,
            notes: item.notes ?? null,
            performedBy: actor.name,
            occurredAt: new Date(),
          },
          select: { id: true },
        })
        await transaction.auditLog.create({
          data: auditData(
            'WORK_ORDER_PRODUCT_RETURNED',
            actor.id,
            order.code,
            context,
            {
              workOrderId: orderId,
              code: order.code,
              workOrderLineId: line.id,
              productId,
              consumptionId: consumption.id,
              movementId: movement.id,
              quantity,
              netConsumed: roundQuantity(netConsumed - quantity),
            },
          ),
        })

        registrations.push({
          consumptionId: consumption.id,
          movementId: movement.id,
          productId,
          quantity: Number(movement.quantity),
        })
        existing.push({ workOrderLineId: line.id, type: 'RETURN', quantity })
      }

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return { order: workOrder as WorkOrderRecord, registrations }
    })
  },

  async finalize(
    orderId: string,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertCanFinalize(order)

      const activities = await transaction.workOrderActivity.findMany({
        where: { workOrderId: orderId },
        select: { status: true },
      })
      if (!activities.length)
        throw new AppError(
          409,
          'WORK_ORDER_NO_ACTIVITIES',
          'Registra al menos una actividad antes de finalizar la orden.',
        )
      if (activities.some((activity) => activity.status === 'PENDIENTE'))
        throw new AppError(
          409,
          'WORK_ORDER_ACTIVITIES_PENDING',
          'Completa todas las actividades antes de finalizar la orden.',
        )

      await transaction.workOrder.update({
        where: { id: orderId },
        data: { status: 'LISTA_PARA_ENTREGA', readyForDeliveryAt: new Date() },
      })
      await transaction.auditLog.create({
        data: auditData(
          'WORK_ORDER_READY_FOR_DELIVERY',
          actor.id,
          order.code,
          context,
          { workOrderId: orderId, code: order.code },
        ),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async deliver(
    orderId: string,
    notes: string | null,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<WorkOrderRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockOrder(transaction, orderId)
      const order = await requireOrder(transaction, orderId)
      assertCanDeliver(order)

      await transaction.workOrder.update({
        where: { id: orderId },
        data: {
          status: 'ENTREGADA',
          deliveredBy: actor.name,
          deliveredAt: new Date(),
          deliveryNotes: notes,
        },
      })
      await transaction.auditLog.create({
        data: auditData('WORK_ORDER_DELIVERED', actor.id, order.code, context, {
          workOrderId: orderId,
          code: order.code,
          notes: notes ?? undefined,
        }),
      })

      const workOrder = await transaction.workOrder.findUnique({
        where: { id: orderId },
        include: workOrderDetailInclude,
      })
      return workOrder as WorkOrderRecord
    })
  },

  async getExecution(orderId: string): Promise<WorkOrderExecutionRecord> {
    const order = await databaseService.client.workOrder.findUnique({
      where: { id: orderId },
      select: workOrderExecutionSelect,
    })
    if (!order)
      throw new AppError(
        404,
        'WORK_ORDER_NOT_FOUND',
        'Orden de taller no encontrada.',
      )
    return order
  },

  async listVehicleHistory(
    vehicleId: string,
    filters: { page: number; pageSize: number },
  ) {
    return databaseService.transaction(async (transaction) => {
      const vehicle = await transaction.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true },
      })
      if (!vehicle)
        throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado.')

      const where: Prisma.WorkOrderWhereInput = {
        vehicleId,
        status: 'ENTREGADA',
      }
      const [items, total] = await Promise.all([
        transaction.workOrder.findMany({
          where,
          select: {
            id: true,
            code: true,
            diagnosis: true,
            subtotal: true,
            total: true,
            performedBy: true,
            deliveredBy: true,
            deliveredAt: true,
            technician: {
              select: { id: true, displayName: true },
            },
            activities: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                description: true,
                status: true,
                performedBy: true,
                occurredAt: true,
              },
            },
            consumptions: {
              select: {
                type: true,
                quantity: true,
                workOrderLine: {
                  select: {
                    id: true,
                    productId: true,
                    name: true,
                    code: true,
                    unitLabel: true,
                  },
                },
              },
            },
          },
          orderBy: [{ deliveredAt: 'desc' }, { createdAt: 'desc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.workOrder.count({ where }),
      ])
      return { items, total }
    })
  },
}
