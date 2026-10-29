import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  findActiveOrNext: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('../src/modules/maintenance/maintenance.repository.js', () => ({
  maintenanceRepository: repository,
}))

import { maintenanceService } from '../src/modules/maintenance/maintenance.service.js'

const context = { requestId: 'request-test', ipAddress: '127.0.0.1' }
const actor = { id: '70c3d238-3fd5-42c7-9a3e-d1eea534899e', name: 'Admin' }

function windowRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: '2d1a8f6c-3f4d-4a1b-9b1c-2f7a1c5d9e10',
    startsAt: new Date('2026-10-20T08:00:00.000Z'),
    endsAt: new Date('2026-10-20T10:00:00.000Z'),
    message: 'Mantenimiento programado',
    createdBy: 'Admin',
    createdAt: new Date('2026-10-18T08:00:00.000Z'),
    updatedAt: new Date('2026-10-18T08:00:00.000Z'),
    ...overrides,
  }
}

describe('Servicio de mantenimiento', () => {
  beforeEach(() => vi.clearAllMocks())

  it('expone la ventana activa con estado y momento de generación', async () => {
    repository.findActiveOrNext.mockResolvedValue(windowRecord())

    const result = await maintenanceService.getStatus(
      new Date('2026-10-20T09:00:00.000Z'),
    )

    expect(result.window).toMatchObject({
      id: windowRecord().id,
      status: 'active',
      message: 'Mantenimiento programado',
    })
    expect(result.generatedAt).toBe('2026-10-20T09:00:00.000Z')
  })

  it('marca como programada una ventana futura y nula si no hay ninguna', async () => {
    repository.findActiveOrNext.mockResolvedValue(
      windowRecord({
        startsAt: new Date('2026-10-21T08:00:00.000Z'),
        endsAt: new Date('2026-10-21T10:00:00.000Z'),
      }),
    )
    const scheduled = await maintenanceService.getStatus(
      new Date('2026-10-20T09:00:00.000Z'),
    )
    expect(scheduled.window?.status).toBe('scheduled')

    repository.findActiveOrNext.mockResolvedValue(null)
    const empty = await maintenanceService.getStatus(
      new Date('2026-10-20T09:00:00.000Z'),
    )
    expect(empty.window).toBeNull()
  })

  it('programa registrando actor y auditoría a través del repositorio', async () => {
    repository.create.mockResolvedValue(windowRecord())

    const result = await maintenanceService.schedule(
      {
        startsAt: new Date('2026-10-20T08:00:00.000Z'),
        endsAt: new Date('2026-10-20T10:00:00.000Z'),
        message: 'Mantenimiento programado',
      },
      actor,
      context,
    )

    expect(repository.create).toHaveBeenCalledOnce()
    const call = repository.create.mock.calls[0][0]
    expect(call).toMatchObject({ createdBy: 'Admin', actorId: actor.id })
    expect(result.createdBy).toBe('Admin')
  })

  it('falla al cancelar una ventana inexistente', async () => {
    repository.cancel.mockResolvedValue({ cancelled: false })

    await expect(
      maintenanceService.cancel(
        '2d1a8f6c-3f4d-4a1b-9b1c-2f7a1c5d9e10',
        actor,
        context,
      ),
    ).rejects.toMatchObject({ status: 404, code: 'MAINTENANCE_NOT_FOUND' })
  })
})
