import { beforeEach, describe, expect, it, vi } from 'vitest'

const database = vi.hoisted(() => ({ transaction: vi.fn() }))

vi.mock('../src/infrastructure/database/prisma.service.js', () => ({
  databaseService: database,
}))

import { appointmentsRepository } from '../src/modules/appointments/appointment.repository.js'

const customerId = 'a0000000-0000-4000-8000-000000000001'
const vehicleId = 'a0000000-0000-4000-8000-000000000002'
const actor = { id: 'user-1', name: 'Admin' }
const context = { requestId: 'req-slot-1', ipAddress: '127.0.0.1' }
const input = {
  customerId,
  vehicleId,
  dateISO: '2099-12-31',
  time: '12:30',
  reason: 'Cita de capacidad',
}
const createdRecord = {
  id: 'appointment-1',
  code: 'CITA-000001',
  customerId,
  vehicleId,
  reason: input.reason,
}

function makeTransaction(activeCount: number) {
  const transaction = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockResolvedValue([{ seq: '1' }]),
    appointment: {
      count: vi.fn().mockResolvedValue(activeCount),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdRecord),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  }
  database.transaction.mockImplementation(
    async (operation: (client: typeof transaction) => Promise<unknown>) =>
      operation(transaction),
  )
  return transaction
}

describe('Repositorio de citas: capacidad por franja (QA-05)', () => {
  beforeEach(() => {
    database.transaction.mockReset()
  })

  it('bloquea la franja y rechaza el noveno turno sin crear la cita', async () => {
    const transaction = makeTransaction(8)

    await expect(
      appointmentsRepository.create(input, actor, context),
    ).rejects.toMatchObject({
      status: 409,
      code: 'APPOINTMENT_SLOT_FULL',
    })

    expect(database.transaction).toHaveBeenCalledTimes(1)
    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1)
    expect(transaction.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      transaction.appointment.count.mock.invocationCallOrder[0],
    )
    expect(transaction.appointment.count).toHaveBeenCalledWith({
      where: {
        date: new Date('2099-12-31T00:00:00.000Z'),
        time: new Date('2000-01-01T12:30:00.000Z'),
        status: 'PROGRAMADA',
      },
    })
    expect(transaction.appointment.findFirst).not.toHaveBeenCalled()
    expect(transaction.appointment.create).not.toHaveBeenCalled()
  })

  it('crea la cita cuando la franja tiene 7 activas y normaliza fecha y hora', async () => {
    const transaction = makeTransaction(7)

    const result = await appointmentsRepository.create(input, actor, context)

    expect(result).toEqual(createdRecord)
    expect(transaction.appointment.findFirst).toHaveBeenCalledWith({
      where: {
        date: new Date('2099-12-31T00:00:00.000Z'),
        time: new Date('2000-01-01T12:30:00.000Z'),
        status: 'PROGRAMADA',
        vehicleId,
      },
      select: { code: true },
    })
    expect(transaction.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId,
        vehicleId,
        date: new Date('2099-12-31T00:00:00.000Z'),
        time: new Date('2000-01-01T12:30:00.000Z'),
        status: 'PROGRAMADA',
      }),
      select: expect.anything(),
    })
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: 'APPOINTMENT_CREATED',
        metadata: expect.objectContaining({
          date: '2099-12-31',
          time: '12:30',
        }),
      }),
    })
  })
})
