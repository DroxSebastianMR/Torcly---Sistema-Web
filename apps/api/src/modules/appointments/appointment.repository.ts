import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  assertActiveSlotCount,
  assertIsProgramada,
  dateToString,
  timeToString,
  toDateOnly,
  toTimeOnly,
} from './appointment.rules.js'
import type { AppointmentFilters } from './appointment.types.js'

const appointmentSummarySelect = {
  id: true,
  code: true,
  customerId: true,
  vehicleId: true,
  date: true,
  time: true,
  reason: true,
  status: true,
  performedBy: true,
  rescheduledBy: true,
  rescheduledAt: true,
  cancelledBy: true,
  cancelledAt: true,
  attendedBy: true,
  attendedAt: true,
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
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      year: true,
    },
  },
  workOrder: {
    select: { id: true, code: true },
  },
} satisfies Prisma.AppointmentSelect

export type AppointmentRecord = Prisma.AppointmentGetPayload<{
  select: typeof appointmentSummarySelect
}>

export type AppointmentStateRow = Prisma.AppointmentGetPayload<{
  select: { id: true; code: true; status: true }
}>

function buildWhere(
  filters: AppointmentFilters,
  organizationId: string,
): Prisma.AppointmentWhereInput {
  const search = filters.search?.trim()
  return {
    organizationId,
    ...(filters.status === 'all' ? {} : { status: filters.status }),
    ...(filters.date ? { date: toDateOnly(filters.date) } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
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
    organizationId: context.organizationId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

async function lockSlot(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  dateISO: string,
  time: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:appointment:slot:${organizationId}:${dateISO}:${time}`}))`
}

async function lockAppointment(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  appointmentId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:appointment:${organizationId}:${appointmentId}`}))`
}

function activeSlotWhere(
  organizationId: string,
  dateISO: string,
  time: string,
  excludeId?: string,
): Prisma.AppointmentWhereInput {
  return {
    organizationId,
    date: toDateOnly(dateISO),
    time: toTimeOnly(time),
    status: 'PROGRAMADA',
    ...(excludeId ? { id: { not: excludeId } } : {}),
  }
}

function activeVehicleSlotWhere(
  organizationId: string,
  dateISO: string,
  time: string,
  vehicleId: string,
  excludeId?: string,
): Prisma.AppointmentWhereInput {
  return {
    ...activeSlotWhere(organizationId, dateISO, time, excludeId),
    vehicleId,
  }
}

async function countActiveInSlot(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  dateISO: string,
  time: string,
  excludeId?: string,
): Promise<number> {
  return transaction.appointment.count({
    where: activeSlotWhere(organizationId, dateISO, time, excludeId),
  })
}

async function assertVehicleAvailableInSlot(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  dateISO: string,
  time: string,
  vehicleId: string,
  excludeId?: string,
) {
  const appointment = await transaction.appointment.findFirst({
    where: activeVehicleSlotWhere(
      organizationId,
      dateISO,
      time,
      vehicleId,
      excludeId,
    ),
    select: { code: true },
  })
  if (appointment) {
    throw new AppError(
      409,
      'APPOINTMENT_VEHICLE_BUSY',
      'El vehículo ya tiene una cita programada en la fecha y hora seleccionadas.',
    )
  }
}

export const appointmentsRepository = {
  async list(filters: AppointmentFilters, organizationId: string) {
    const where = buildWhere(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.measure('appointments.list.records', () =>
        databaseService.client.appointment.findMany({
          select: appointmentSummarySelect,
          where,
          orderBy: { createdAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      databaseService.measure('appointments.list.total', () =>
        databaseService.client.appointment.count({ where }),
      ),
    ])
    return { items, total }
  },

  findById(
    id: string,
    organizationId: string,
  ): Promise<AppointmentRecord | null> {
    return databaseService.client.appointment.findFirst({
      where: { id, organizationId },
      select: appointmentSummarySelect,
    })
  },

  findCustomerRef(id: string, organizationId: string) {
    return databaseService.client.customer.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        documentNumber: true,
        firstName: true,
        lastName: true,
        legalName: true,
      },
    })
  },

  findVehicleOfCustomer(
    vehicleId: string,
    customerId: string,
    organizationId: string,
  ) {
    return databaseService.client.vehicle.findFirst({
      where: { id: vehicleId, customerId, organizationId },
      select: {
        id: true,
        plate: true,
        brand: true,
        model: true,
        year: true,
      },
    })
  },

  findUserDisplayNames(ids: string[]) {
    return databaseService.client.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, displayName: true },
    })
  },

  async getStats(organizationId: string) {
    const [byStatus, hoy] = await Promise.all([
      databaseService.client.appointment.groupBy({
        where: { organizationId },
        by: ['status'],
        _count: { _all: true },
      }),
      databaseService.client.appointment.count({
        where: {
          organizationId,
          date: toDateOnly(todayLocalDate()),
          status: 'PROGRAMADA',
        },
      }),
    ])
    const counts = new Map(
      byStatus.map((item) => [item.status, item._count._all]),
    )
    return {
      total: byStatus.reduce((sum, item) => sum + item._count._all, 0),
      programadas: counts.get('PROGRAMADA') ?? 0,
      canceladas: counts.get('CANCELADA') ?? 0,
      hoy,
    }
  },

  async create(
    input: {
      customerId: string
      vehicleId: string
      dateISO: string
      time: string
      reason: string
    },
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<AppointmentRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockSlot(transaction, organizationId, input.dateISO, input.time)
      const active = await countActiveInSlot(
        transaction,
        organizationId,
        input.dateISO,
        input.time,
      )
      assertActiveSlotCount(active)
      await assertVehicleAvailableInSlot(
        transaction,
        organizationId,
        input.dateISO,
        input.time,
        input.vehicleId,
      )

      const rows = await transaction.$queryRaw<
        Array<{ seq: number | string }>
      >`SELECT nextval('"appointments_code_seq"') AS seq`
      const code = `CITA-${String(Number(rows[0].seq)).padStart(6, '0')}`

      const appointment = await transaction.appointment.create({
        data: {
          organizationId,
          code,
          customerId: input.customerId,
          vehicleId: input.vehicleId,
          date: toDateOnly(input.dateISO),
          time: toTimeOnly(input.time),
          reason: input.reason,
          status: 'PROGRAMADA',
          performedBy: actor.name,
        },
        select: appointmentSummarySelect,
      })

      await transaction.auditLog.create({
        data: auditData(
          'APPOINTMENT_CREATED',
          actor.id,
          appointment.code,
          context,
          {
            appointmentId: appointment.id,
            code: appointment.code,
            customerId: appointment.customerId,
            vehicleId: appointment.vehicleId,
            date: input.dateISO,
            time: input.time,
            reason: appointment.reason,
          },
        ),
      })

      return appointment
    })
  },

  async reschedule(
    id: string,
    input: { dateISO: string; time: string },
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<AppointmentRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockAppointment(transaction, organizationId, id)

      const existing = await transaction.appointment.findFirst({
        where: { id, organizationId },
        select: {
          id: true,
          code: true,
          status: true,
          vehicleId: true,
          date: true,
          time: true,
        },
      })
      if (!existing)
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Cita no encontrada.')
      assertIsProgramada(existing)

      await lockSlot(transaction, organizationId, input.dateISO, input.time)
      const active = await countActiveInSlot(
        transaction,
        organizationId,
        input.dateISO,
        input.time,
        id,
      )
      assertActiveSlotCount(active)
      await assertVehicleAvailableInSlot(
        transaction,
        organizationId,
        input.dateISO,
        input.time,
        existing.vehicleId,
        id,
      )

      const appointment = await transaction.appointment.update({
        where: { id },
        data: {
          date: toDateOnly(input.dateISO),
          time: toTimeOnly(input.time),
          rescheduledBy: actor.name,
          rescheduledAt: new Date(),
        },
        select: appointmentSummarySelect,
      })

      await transaction.auditLog.create({
        data: auditData(
          'APPOINTMENT_RESCHEDULED',
          actor.id,
          appointment.code,
          context,
          {
            appointmentId: appointment.id,
            code: appointment.code,
            previousDate: dateToString(existing.date),
            previousTime: timeToString(existing.time),
            date: input.dateISO,
            time: input.time,
          },
        ),
      })

      return appointment
    })
  },

  async cancel(
    id: string,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<AppointmentRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockAppointment(transaction, organizationId, id)

      const existing = await transaction.appointment.findFirst({
        where: { id, organizationId },
        select: { id: true, code: true, status: true },
      })
      if (!existing)
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Cita no encontrada.')
      assertIsProgramada(existing)

      const appointment = await transaction.appointment.update({
        where: { id },
        data: {
          status: 'CANCELADA',
          cancelledBy: actor.name,
          cancelledAt: new Date(),
        },
        select: appointmentSummarySelect,
      })

      await transaction.auditLog.create({
        data: auditData(
          'APPOINTMENT_CANCELLED',
          actor.id,
          appointment.code,
          context,
          {
            appointmentId: appointment.id,
            code: appointment.code,
            date: dateToString(appointment.date),
            time: timeToString(appointment.time),
          },
        ),
      })

      return appointment
    })
  },
}

function todayLocalDate(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}
