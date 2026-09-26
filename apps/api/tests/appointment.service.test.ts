import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  findCustomerRef: vi.fn(),
  findVehicleOfCustomer: vi.fn(),
  findUserDisplayNames: vi.fn(),
  getStats: vi.fn(),
  create: vi.fn(),
  reschedule: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('../src/modules/appointments/appointment.repository.js', () => ({
  appointmentsRepository: repository,
}))

import { appointmentsService } from '../src/modules/appointments/appointment.service.js'

const context = {
  requestId: 'req-appointment-1',
  ipAddress: '127.0.0.1',
}

const customerId = 'a0000000-0000-4000-8000-000000000001'
const vehicleId = 'a0000000-0000-4000-8000-000000000002'

const customerRef = {
  id: customerId,
  documentNumber: '12345678',
  firstName: 'Ana',
  lastName: 'Pérez',
  legalName: null,
}

const vehicleRef = {
  id: vehicleId,
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appointment-1',
    code: 'CITA-000001',
    customerId,
    vehicleId,
    date: new Date('2099-12-31T00:00:00.000Z'),
    time: new Date('2000-01-01T09:30:00.000Z'),
    reason: 'Cambio de aceite',
    status: 'PROGRAMADA',
    performedBy: 'actor-1',
    rescheduledBy: null,
    rescheduledAt: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: new Date('2026-09-25T00:00:00.000Z'),
    updatedAt: new Date('2026-09-25T00:00:00.000Z'),
    customer: customerRef,
    vehicle: vehicleRef,
    ...overrides,
  }
}

const input = {
  customerId,
  vehicleId,
  date: '2099-12-31',
  time: '09:30',
  reason: 'Cambio de aceite',
}

const actor = { id: 'user-1', name: 'Ana Pérez' }

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de citas', () => {
  it('lista citas con paginación, detalle de cliente y vehículo y resumen', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })
    repository.getStats.mockResolvedValue({
      total: 1,
      programadas: 1,
      canceladas: 0,
      hoy: 0,
    })

    const result = await appointmentsService.list({
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      status: 'all',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 'appointment-1',
          code: 'CITA-000001',
          customer: {
            id: customerId,
            documentNumber: '12345678',
            name: 'Ana Pérez',
          },
          vehicle: vehicleRef,
          date: '2099-12-31',
          time: '09:30',
          reason: 'Cambio de aceite',
          status: 'PROGRAMADA',
          performedBy: 'actor-1',
          rescheduledBy: null,
          rescheduledAt: null,
          cancelledBy: null,
          cancelledAt: null,
          attendedBy: null,
          attendedAt: null,
          workOrder: null,
          createdAt: '2026-09-25T00:00:00.000Z',
          updatedAt: '2026-09-25T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      summary: { total: 1, programadas: 1, canceladas: 0, hoy: 0 },
    })
  })

  it('devuelve una cita por identificador', async () => {
    repository.findById.mockResolvedValue(record())

    const result = await appointmentsService.getById('appointment-1')
    expect(result.data.code).toBe('CITA-000001')
    expect(result.data.date).toBe('2099-12-31')
    expect(result.data.time).toBe('09:30')
  })

  it('lanza 404 cuando la cita no existe', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(appointmentsService.getById('missing')).rejects.toThrowError(
      expect.objectContaining({
        status: 404,
        code: 'APPOINTMENT_NOT_FOUND',
      }),
    )
  })

  it('crea una cita validando cliente y vehículo', async () => {
    repository.findCustomerRef.mockResolvedValue(customerRef)
    repository.findVehicleOfCustomer.mockResolvedValue(vehicleRef)
    repository.create.mockResolvedValue(record())

    const result = await appointmentsService.create(input, actor, context)

    expect(repository.findVehicleOfCustomer).toHaveBeenCalledWith(
      vehicleId,
      customerId,
    )
    expect(repository.create).toHaveBeenCalledWith(
      {
        customerId,
        vehicleId,
        dateISO: '2099-12-31',
        time: '09:30',
        reason: 'Cambio de aceite',
      },
      actor,
      context,
    )
    expect(result.data.status).toBe('PROGRAMADA')
  })

  it('rechaza crear cuando el cliente no existe', async () => {
    repository.findCustomerRef.mockResolvedValue(null)

    await expect(
      appointmentsService.create(input, actor, context),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 404,
        code: 'CUSTOMER_NOT_FOUND',
      }),
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('rechaza crear cuando el vehículo no pertenece al cliente', async () => {
    repository.findCustomerRef.mockResolvedValue(customerRef)
    repository.findVehicleOfCustomer.mockResolvedValue(null)

    await expect(
      appointmentsService.create(input, actor, context),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'APPOINTMENT_VEHICLE_INVALID',
      }),
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('rechaza crear con fecha pasada antes de persistir', async () => {
    repository.findCustomerRef.mockResolvedValue(customerRef)
    repository.findVehicleOfCustomer.mockResolvedValue(vehicleRef)

    await expect(
      appointmentsService.create(
        { ...input, date: '2020-01-01' },
        actor,
        context,
      ),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'APPOINTMENT_PAST_DATE',
      }),
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('reprograma una cita con el nuevo horario y actor', async () => {
    repository.reschedule.mockResolvedValue(
      record({
        date: new Date('2099-12-31T00:00:00.000Z'),
        time: new Date('2000-01-01T14:00:00.000Z'),
        rescheduledBy: 'Ana Pérez',
      }),
    )

    const result = await appointmentsService.reschedule(
      'appointment-1',
      { date: '2099-12-31', time: '14:00' },
      actor,
      context,
    )

    expect(repository.reschedule).toHaveBeenCalledWith(
      'appointment-1',
      { dateISO: '2099-12-31', time: '14:00' },
      actor,
      context,
    )
    expect(result.data.time).toBe('14:00')
    expect(result.data.rescheduledBy).toBe('Ana Pérez')
  })

  it('rechaza reprogramar a un horario pasado', async () => {
    await expect(
      appointmentsService.reschedule(
        'appointment-1',
        { date: '2020-01-01', time: '10:00' },
        actor,
        context,
      ),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'APPOINTMENT_PAST_DATE',
      }),
    )
    expect(repository.reschedule).not.toHaveBeenCalled()
  })

  it('cancela una cita conservando el registro', async () => {
    repository.cancel.mockResolvedValue(
      record({
        status: 'CANCELADA',
        cancelledBy: 'Ana Pérez',
      }),
    )

    const result = await appointmentsService.cancel(
      'appointment-1',
      actor,
      context,
    )

    expect(repository.cancel).toHaveBeenCalledWith(
      'appointment-1',
      actor,
      context,
    )
    expect(result.data.status).toBe('CANCELADA')
    expect(result.data.cancelledBy).toBe('Ana Pérez')
  })
})
