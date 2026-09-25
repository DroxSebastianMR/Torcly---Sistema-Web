import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  appointmentsRepository,
  type AppointmentRecord,
} from './appointment.repository.js'
import {
  assertNotPast,
  dateToString,
  timeToString,
} from './appointment.rules.js'
import type {
  AppointmentCustomerRef,
  AppointmentFilters,
  AppointmentInput,
  AppointmentItem,
  AppointmentRescheduleInput,
  AppointmentVehicleRef,
} from './appointment.types.js'

type AppointmentActor = { id: string; name: string }

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeActor(actor: AppointmentActor | string): AppointmentActor {
  return typeof actor === 'string' ? { id: actor, name: actor } : actor
}

function isUserId(value: string | null) {
  return Boolean(value && uuidPattern.test(value))
}

function toCustomerRef(
  customer: AppointmentRecord['customer'],
): AppointmentCustomerRef | null {
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

function toVehicleRef(
  vehicle: AppointmentRecord['vehicle'],
): AppointmentVehicleRef {
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
  }
}

function toItem(
  appointment: AppointmentRecord,
  actorNames = new Map<string, string>(),
): AppointmentItem {
  return {
    id: appointment.id,
    code: appointment.code,
    customer: toCustomerRef(appointment.customer),
    vehicle: toVehicleRef(appointment.vehicle),
    date: dateToString(appointment.date),
    time: timeToString(appointment.time),
    reason: appointment.reason,
    status: appointment.status,
    performedBy:
      actorNames.get(appointment.performedBy) ?? appointment.performedBy,
    rescheduledBy: appointment.rescheduledBy
      ? (actorNames.get(appointment.rescheduledBy) ?? appointment.rescheduledBy)
      : null,
    rescheduledAt: appointment.rescheduledAt
      ? appointment.rescheduledAt.toISOString()
      : null,
    cancelledBy: appointment.cancelledBy
      ? (actorNames.get(appointment.cancelledBy) ?? appointment.cancelledBy)
      : null,
    cancelledAt: appointment.cancelledAt
      ? appointment.cancelledAt.toISOString()
      : null,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  }
}

async function resolveActorNames(
  appointments: AppointmentRecord[],
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(
      appointments
        .flatMap((appointment) => [
          appointment.performedBy,
          appointment.rescheduledBy,
          appointment.cancelledBy,
        ])
        .filter(
          (value): value is string =>
            typeof value === 'string' && isUserId(value),
        ),
    ),
  ]
  if (!ids.length) return new Map<string, string>()

  const users = await appointmentsRepository.findUserDisplayNames(ids)
  return new Map(users.map((user) => [user.id, user.displayName]))
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'APPOINTMENT_REFERENCE_INVALID',
        'El cliente o vehículo seleccionado ya no está disponible.',
      )
    }

    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'APPOINTMENT_DUPLICATE_CODE',
        'Ya existe una cita con ese código.',
      )
    }
  }

  throw error
}

export const appointmentsService = {
  async list(filters: AppointmentFilters) {
    const result = await appointmentsRepository.list(filters)
    const actorNames = await resolveActorNames(result.items)
    const stats = await appointmentsRepository.getStats()
    return {
      data: result.items.map((item) => toItem(item, actorNames)),
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
    const appointment = await appointmentsRepository.findById(id)
    if (!appointment)
      throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Cita no encontrada.')
    return {
      data: toItem(appointment, await resolveActorNames([appointment])),
    }
  },

  async create(
    input: AppointmentInput,
    actor: AppointmentActor | string,
    context: RequestContext,
  ) {
    const customer = await appointmentsRepository.findCustomerRef(
      input.customerId,
    )
    if (!customer)
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')

    const vehicle = await appointmentsRepository.findVehicleOfCustomer(
      input.vehicleId,
      input.customerId,
    )
    if (!vehicle)
      throw new AppError(
        400,
        'APPOINTMENT_VEHICLE_INVALID',
        'El vehículo seleccionado no pertenece al cliente.',
      )

    assertNotPast(input.date, input.time)

    try {
      const appointment = await appointmentsRepository.create(
        {
          customerId: input.customerId,
          vehicleId: input.vehicleId,
          dateISO: input.date,
          time: input.time,
          reason: input.reason,
        },
        normalizeActor(actor),
        context,
      )
      return { data: toItem(appointment) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async reschedule(
    id: string,
    input: AppointmentRescheduleInput,
    actor: AppointmentActor | string,
    context: RequestContext,
  ) {
    assertNotPast(input.date, input.time)
    const appointment = await appointmentsRepository.reschedule(
      id,
      { dateISO: input.date, time: input.time },
      normalizeActor(actor),
      context,
    )
    return { data: toItem(appointment) }
  },

  async cancel(
    id: string,
    actor: AppointmentActor | string,
    context: RequestContext,
  ) {
    const appointment = await appointmentsRepository.cancel(
      id,
      normalizeActor(actor),
      context,
    )
    return { data: toItem(appointment) }
  },
}
