import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/shared/errors/app-error.js'
import { hashPassword } from '../src/modules/auth/password.js'

const repository = vi.hoisted(() => ({
  findUserByIdentifier: vi.fn(),
  recordUnknownLoginFailure: vi.fn(),
  recordLoginFailure: vi.fn(),
  recordRejectedLogin: vi.fn(),
  createSession: vi.fn(),
  findSession: vi.fn(),
  refreshSession: vi.fn(),
  expireSession: vi.fn(),
  revokeSession: vi.fn(),
  recordAccessDenied: vi.fn(),
  recordPasswordResetRequested: vi.fn(),
  findPasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn(),
}))

vi.mock('../src/modules/auth/auth.repository.js', () => ({
  authRepository: repository,
}))

import { authService } from '../src/modules/auth/auth.service.js'
import { setPasswordResetNotifier } from '../src/modules/auth/password-reset-notifier.js'
import type { PasswordResetMessage } from '../src/modules/auth/password-reset-notifier.js'

const sent: PasswordResetMessage[] = []

const context = {
  requestId: 'request-test',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
}

function userRecord(passwordHash: string) {
  return {
    id: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
    username: 'admin',
    email: 'admin@torcly.local',
    displayName: 'Administrador',
    passwordHash,
    active: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [
      {
        userId: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
        roleId: '93fb24de-8f46-474b-a452-16147258ee79',
        assignedAt: new Date(),
        role: {
          id: '93fb24de-8f46-474b-a452-16147258ee79',
          code: 'administrator',
          name: 'Administrador',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [
            {
              roleId: '93fb24de-8f46-474b-a452-16147258ee79',
              permissionId: 'b2f7b118-dc47-4a6a-b225-a7294268b4e6',
              permission: { code: 'products:read' },
            },
          ],
        },
      },
    ],
  }
}

describe('Servicio de autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sent.length = 0
    setPasswordResetNotifier({
      send: async (message) => {
        sent.push(message)
      },
    })
  })

  it('crea una sesión y devuelve solo los permisos asignados', async () => {
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findUserByIdentifier.mockResolvedValue(user)
    repository.createSession.mockResolvedValue(user)

    const result = await authService.login(
      { identifier: 'ADMIN', password: 'Clave-segura-2026' },
      context,
    )

    expect(repository.findUserByIdentifier).toHaveBeenCalledWith('admin')
    expect(repository.createSession).toHaveBeenCalledOnce()
    expect(result.token).toBeTruthy()
    expect(result.user).toMatchObject({
      username: 'admin',
      permissions: ['products:read'],
    })
  })

  it('usa un error genérico para usuarios inexistentes', async () => {
    repository.findUserByIdentifier.mockResolvedValue(null)

    await expect(
      authService.login(
        { identifier: 'nadie', password: 'incorrecta' },
        context,
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
    } satisfies Partial<AppError>)
    expect(repository.recordUnknownLoginFailure).toHaveBeenCalledOnce()
  })

  it('bloquea durante el quinto intento fallido', async () => {
    const user = {
      ...userRecord(await hashPassword('Clave-segura-2026')),
      failedLoginAttempts: 4,
    }
    repository.findUserByIdentifier.mockResolvedValue(user)

    await expect(
      authService.login(
        { identifier: user.email, password: 'incorrecta' },
        context,
      ),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' })

    const call = repository.recordLoginFailure.mock.calls[0]
    expect(call[2]).toBe(5)
    expect(call[3]).toBeInstanceOf(Date)
    expect(call[3].getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000)
  })

  it('rechaza y revoca una sesión expirada', async () => {
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findSession.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: user.id,
      expiresAt: new Date(Date.now() - 1),
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      user,
    })

    await expect(
      authService.authenticate('token', context),
    ).rejects.toMatchObject({ status: 401, code: 'AUTH_SESSION_EXPIRED' })
    expect(repository.expireSession).toHaveBeenCalledOnce()
  })

  it('registra y deniega permisos ausentes', async () => {
    await expect(
      authService.assertPermission(
        {
          id: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
          name: 'Operador',
          email: 'operador@torcly.local',
          username: 'operador',
          permissions: ['products:read'],
        },
        'products:write',
        context,
      ),
    ).rejects.toMatchObject({ status: 403, code: 'AUTH_FORBIDDEN' })
    expect(repository.recordAccessDenied).toHaveBeenCalledOnce()
  })

  it('solicita recuperación almacenando solo el hash y sin exponer el token', async () => {
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findUserByIdentifier.mockResolvedValue(user)

    await authService.requestPasswordRecovery({ identifier: 'ADMIN' }, context)

    expect(repository.findUserByIdentifier).toHaveBeenCalledWith('admin')
    const call = repository.recordPasswordResetRequested.mock.calls[0]
    expect(call[0]).toBe(user.id)
    expect(call[1]).toMatch(/^[a-f0-9]{64}$/)
    expect(call[2].getTime()).toBeGreaterThan(Date.now() + 25 * 60 * 1000)
    expect(sent).toHaveLength(1)
    expect(sent[0].token).toBeTruthy()
    expect(call[1]).not.toBe(sent[0].token)
  })

  it('responde igual para identificadores inexistentes sin crear tokens', async () => {
    repository.findUserByIdentifier.mockResolvedValue(null)

    await expect(
      authService.requestPasswordRecovery({ identifier: 'nadie' }, context),
    ).resolves.toBeUndefined()
    expect(repository.recordPasswordResetRequested).not.toHaveBeenCalled()
    expect(sent).toHaveLength(0)
  })

  it('no genera recuperación para cuentas inactivas', async () => {
    const user = {
      ...userRecord(await hashPassword('Clave-segura-2026')),
      active: false,
    }
    repository.findUserByIdentifier.mockResolvedValue(user)

    await authService.requestPasswordRecovery(
      { identifier: user.email },
      context,
    )

    expect(repository.recordPasswordResetRequested).not.toHaveBeenCalled()
    expect(sent).toHaveLength(0)
  })

  it('consume un token vigente y delega el cambio de contraseña', async () => {
    repository.findPasswordResetToken.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      requestId: null,
      createdAt: new Date(),
      user: { id: '70c3d238-3fd5-42c7-9a3e-d1eea534899e', active: true },
    })
    repository.consumePasswordResetToken.mockResolvedValue({ consumed: true })

    await authService.resetPassword(
      {
        token: 'token-de-recuperacion-suficientemente-largo',
        password: 'Nueva-clave-2026',
      },
      context,
    )

    expect(repository.consumePasswordResetToken).toHaveBeenCalledOnce()
    const call = repository.consumePasswordResetToken.mock.calls[0]
    expect(call[1]).toContain('scrypt')
  })

  it('rechaza tokens vencidos o ya consumidos sin cambiar la contraseña', async () => {
    repository.findPasswordResetToken.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: new Date(Date.now() - 500),
      requestId: null,
      createdAt: new Date(),
      user: { id: '70c3d238-3fd5-42c7-9a3e-d1eea534899e', active: true },
    })

    await expect(
      authService.resetPassword(
        {
          token: 'token-de-recuperacion-suficientemente-largo',
          password: 'Nueva-clave-2026',
        },
        context,
      ),
    ).rejects.toMatchObject({ status: 400, code: 'AUTH_RESET_INVALID' })
    expect(repository.consumePasswordResetToken).not.toHaveBeenCalled()
  })
})
