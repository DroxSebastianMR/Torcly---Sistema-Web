import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  assertAppointmentAttendable,
  assertBudgetEditable,
  assertCanDecide,
  assertHasLines,
  assertTechnicianEditable,
  shouldMoveToDiagnosis,
} from './work-order.rules.js'
import type { WorkOrderFilters } from './work-order.types.js'

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
      ] = await Promise.all([
        transaction.workOrder.count(),
        transaction.workOrder.count({ where: { status: 'RECEPCIONADA' } }),
        transaction.workOrder.count({ where: { status: 'EN_DIAGNOSTICO' } }),
        transaction.workOrder.count({
          where: { status: 'PENDIENTE_APROBACION' },
        }),
        transaction.workOrder.count({ where: { status: 'APROBADA' } }),
        transaction.workOrder.count({ where: { status: 'RECHAZADA' } }),
      ])
      return {
        total,
        recepcionadas,
        enDiagnostico,
        pendientesAprobacion,
        aprobadas,
        rechazadas,
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
}
