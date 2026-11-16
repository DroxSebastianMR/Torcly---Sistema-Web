import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'
import { AppError } from '../src/shared/errors/app-error.js'

const repository = vi.hoisted(() => ({
  current: vi.fn(),
  findById: vi.fn(),
  listClosed: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
}))

vi.mock('../src/modules/cash-sessions/cash-session.repository.js', () => ({
  cashSessionsRepository: repository,
}))

import { cashSessionsService } from '../src/modules/cash-sessions/cash-session.service.js'

const context = { requestId: 'request-1', ipAddress: '127.0.0.1' }
const actor = { id: 'user-1', name: 'Responsable' }
const organizationId = 'organization-1'

describe('Servicio de caja', () => {
  beforeEach(() => {
    repository.open.mockReset()
  })

  it('convierte una colisión concurrente de caja abierta en conflicto accionable', async () => {
    repository.open.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Caja duplicada', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      cashSessionsService.open(
        { requestId: 'request-1', openingAmount: 0 },
        actor,
        context,
        organizationId,
      ),
    ).rejects.toBeInstanceOf(AppError)

    await expect(
      cashSessionsService.open(
        { requestId: 'request-1', openingAmount: 0 },
        actor,
        context,
        organizationId,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'CASH_SESSION_ALREADY_OPEN',
    })
  })
})
