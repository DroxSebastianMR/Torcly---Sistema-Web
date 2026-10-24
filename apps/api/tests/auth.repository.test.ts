import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => {
  const transaction = {
    user: { update: vi.fn() },
    auditLog: { create: vi.fn() },
  }
  const client = { auditLog: { create: vi.fn() } }
  return {
    transaction,
    client,
    databaseService: {
      client,
      transaction: vi.fn(),
    },
  }
})

vi.mock('../src/infrastructure/database/prisma.service.js', () => ({
  databaseService: db.databaseService,
}))

import { authRepository } from '../src/modules/auth/auth.repository.js'

const context = {
  requestId: 'request-test',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
}

const userId = '70c3d238-3fd5-42c7-9a3e-d1eea534899e'
const identifier = 'admin@torcly.local'

describe('Repositorio de autenticación y auditoría', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.databaseService.transaction.mockImplementation(
      async (callback: (transaction: unknown) => unknown) =>
        callback(db.transaction),
    )
    db.transaction.auditLog.create.mockResolvedValue({})
    db.client.auditLog.create.mockResolvedValue({})
  })

  it('registra el intento fallido sin bloquear antes del límite', async () => {
    db.transaction.user.update.mockResolvedValueOnce({
      failedLoginAttempts: 4,
    })

    const result = await authRepository.recordLoginFailure(
      userId,
      identifier,
      5,
      new Date(Date.now() + 60_000),
      context,
    )

    expect(result).toEqual({ failedLoginAttempts: 4, locked: false })
    expect(db.transaction.user.update).toHaveBeenCalledOnce()
    expect(db.transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: 'LOGIN_FAILURE',
        userId,
        identifier,
        requestId: context.requestId,
        metadata: { failedLoginAttempts: 4 },
      }),
    })
  })

  it('bloquea la cuenta y audita ACCOUNT_LOCKED al alcanzar el límite', async () => {
    const lockUntil = new Date(Date.now() + 15 * 60_000)
    db.transaction.user.update
      .mockResolvedValueOnce({ failedLoginAttempts: 5 })
      .mockResolvedValueOnce({})

    const result = await authRepository.recordLoginFailure(
      userId,
      identifier,
      5,
      lockUntil,
      context,
    )

    expect(result).toEqual({ failedLoginAttempts: 5, locked: true })
    expect(db.transaction.user.update).toHaveBeenCalledTimes(2)
    expect(db.transaction.user.update).toHaveBeenLastCalledWith({
      where: { id: userId },
      data: { lockedUntil: lockUntil },
    })
    expect(db.transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: 'ACCOUNT_LOCKED',
        userId,
        identifier,
        metadata: { failedLoginAttempts: 5 },
      }),
    })
  })

  it('audita el rechazo de una cuenta inactiva sin crear sesión', async () => {
    await authRepository.recordRejectedLogin(userId, identifier, context)

    expect(db.client.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: 'LOGIN_FAILURE',
        userId,
        identifier,
        requestId: context.requestId,
      }),
    })
    expect(db.transaction.user.update).not.toHaveBeenCalled()
    expect(db.transaction.auditLog.create).not.toHaveBeenCalled()
  })
})
