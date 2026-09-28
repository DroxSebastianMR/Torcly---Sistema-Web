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

function buildWhere(filters: AppointmentFilters): Prisma.AppointmentWhereInput {
  const search = filters.search?.trim()
  return {
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
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

async function lockSlot(
  transaction: Prisma.TransactionClient,
  dateISO: string,
  time: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:appointment:slot:${dateISO}:${time}`}))`
}

async function lockAppointment(
  transaction: Prisma.TransactionClient,
  appointmentId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:appointment:${appointmentId}`}))`
}

function activeSlotWhere(
  dateISO: string,
  time: string,
  excludeId?: string,
): Prisma.AppointmentWhereInput {
  return {
    date: toDateOnly(dateISO),
    time: toTimeOnly(time),
    status: 'PROGRAMADA',
    ...(excludeId ? { id: { not: excludeId } } : {}),
  }
}

function activeVehicleSlotWhere(
  dateISO: string,
  time: string,
  vehicleId: string,
  excludeId?: string,
): Prisma.AppointmentWhereInput {
  return {
    ...activeSlotWhere(dateISO, time, excludeId),
    vehicleId,
  }
}

async function countActiveInSlot(
  transaction: Prisma.TransactionClient,
  dateISO: string,
  time: string,
  excludeId?: string,
): Promise<number> {
  return transaction.appointment.count({
    where: activeSlotWhere(dateISO, time, excludeId),
  })
}

async function assertVehicleAvailableInSlot(
  transaction: Prisma.TransactionClient,
  dateISO: string,
  time: string,
  vehicleId: string,
  excludeId?: string,
) {
  const appointment = await transaction.appointment.findFirst({
    where: activeVehicleSlotWhere(dateISO, time, vehicleId, excludeId),
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
  async list(filters: AppointmentFilters) {
    const where = buildWhere(filters)
    return databaseService.transaction(async (transaction) => {
      const [items, total] = await Promise.all([
        transaction.appointment.findMany({
          select: appointmentSummarySelect,
          where,
          orderBy: { createdAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.appointment.count({ where }),
      ])
      return { items, total }
    })
  },

  findById(id: string): Promise<AppointmentRecord | null> {
    return databaseService.client.appointment.findUnique({
      where: { id },
      select: appointmentSummarySelect,
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

  findVehicleOfCustomer(vehicleId: string, customerId: string) {
    return databaseService.client.vehicle.findFirst({
      where: { id: vehicleId, customerId },
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

  async getStats() {
    return databaseService.transaction(async (transaction) => {
      const [total, programadas, canceladas, hoy] = await Promise.all([
        transaction.appointment.count(),
        transaction.appointment.count({ where: { status: 'PROGRAMADA' } }),
        transaction.appointment.count({ where: { status: 'CANCELADA' } }),
        transaction.appointment.count({
          where: {
            date: toDateOnly(todayLocalDate()),
            status: 'PROGRAMADA',
          },
        }),
      ])
      return { total, programadas, canceladas, hoy }
    })
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
  ): Promise<AppointmentRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockSlot(transaction, input.dateISO, input.time)
      const active = await countActiveInSlot(
        transaction,
        input.dateISO,
        input.time,
      )
      assertActiveSlotCount(active)
      await assertVehicleAvailableInSlot(
        transaction,
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
  ): Promise<AppointmentRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockAppointment(transaction, id)

      const existing = await transaction.appointment.findUnique({
        where: { id },
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

      await lockSlot(transaction, input.dateISO, input.time)
      const active = await countActiveInSlot(
        transaction,
        input.dateISO,
        input.time,
        id,
      )
      assertActiveSlotCount(active)
      await assertVehicleAvailableInSlot(
        transaction,
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
  ): Promise<AppointmentRecord> {
    return databaseService.transaction(async (transaction) => {
      await lockAppointment(transaction, id)

      const existing = await transaction.appointment.findUnique({
        where: { id },
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
