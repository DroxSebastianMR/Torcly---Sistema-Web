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
  renewSession: vi.fn(),
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
    authService.clearAuthenticationCacheForTests()
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

  it('mantiene el error genérico para cuentas inactivas y reporta un bloqueo vigente', async () => {
    const passwordHash = await hashPassword('Clave-segura-2026')
    const inactive = { ...userRecord(passwordHash), active: false }
    const locked = {
      ...userRecord(passwordHash),
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 60_000),
    }
    const genericExpected = {
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'No se pudo iniciar sesión con las credenciales proporcionadas.',
    }

    repository.findUserByIdentifier.mockResolvedValue(inactive)
    await expect(
      authService.login(
        { identifier: inactive.email, password: 'Clave-segura-2026' },
        context,
      ),
    ).rejects.toMatchObject(genericExpected)

    repository.findUserByIdentifier.mockResolvedValue(locked)
    await expect(
      authService.login(
        { identifier: locked.email, password: 'Clave-segura-2026' },
        context,
      ),
    ).rejects.toMatchObject({
      status: 429,
      code: 'AUTH_LOGIN_LOCKED',
    })

    repository.findUserByIdentifier.mockResolvedValue(null)
    await expect(
      authService.login(
        { identifier: 'nadie', password: 'incorrecta' },
        context,
      ),
    ).rejects.toMatchObject(genericExpected)

    expect(repository.recordRejectedLogin).toHaveBeenCalledTimes(2)
    expect(repository.recordUnknownLoginFailure).toHaveBeenCalledOnce()
    expect(repository.createSession).not.toHaveBeenCalled()
  })

  it('permite iniciar sesión cuando el bloqueo ya expiró', async () => {
    const user = {
      ...userRecord(await hashPassword('Clave-segura-2026')),
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() - 1000),
    }
    repository.findUserByIdentifier.mockResolvedValue(user)
    repository.createSession.mockResolvedValue(user)

    const result = await authService.login(
      { identifier: user.email, password: 'Clave-segura-2026' },
      context,
    )

    expect(result.token).toBeTruthy()
    expect(repository.createSession).toHaveBeenCalledOnce()
    expect(repository.recordRejectedLogin).not.toHaveBeenCalled()
    expect(repository.recordLoginFailure).not.toHaveBeenCalled()
  })

  it('bloquea durante el quinto intento fallido', async () => {
    const user = {
      ...userRecord(await hashPassword('Clave-segura-2026')),
      failedLoginAttempts: 4,
    }
    repository.findUserByIdentifier.mockResolvedValue(user)
    repository.recordLoginFailure.mockResolvedValue({
      failedLoginAttempts: 5,
      locked: true,
    })

    await expect(
      authService.login(
        { identifier: user.email, password: 'incorrecta' },
        context,
      ),
    ).rejects.toMatchObject({
      status: 429,
      code: 'AUTH_LOGIN_LOCKED',
      details: expect.objectContaining({
        lockMinutes: 15,
        maximumAttempts: 5,
      }),
    })

    const call = repository.recordLoginFailure.mock.calls[0]
    expect(call[2]).toBe(5)
    expect(call[3]).toBeInstanceOf(Date)
    expect(call[3].getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000)
  })

  it('informa los intentos restantes antes de aplicar el bloqueo', async () => {
    const user = {
      ...userRecord(await hashPassword('Clave-segura-2026')),
      failedLoginAttempts: 2,
    }
    repository.findUserByIdentifier.mockResolvedValue(user)
    repository.recordLoginFailure.mockResolvedValue({
      failedLoginAttempts: 3,
      locked: false,
    })

    await expect(
      authService.login(
        { identifier: user.email, password: 'incorrecta' },
        context,
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      details: {
        attemptsRemaining: 2,
        maximumAttempts: 5,
        lockMinutes: 15,
      },
    })
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

  it('evita escribir actividad para solicitudes cercanas y renueva una sesión activa cada cinco minutos', async () => {
    const now = new Date('2026-10-24T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findSession.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: user.id,
      expiresAt: new Date(now.getTime() + 30 * 60_000),
      lastActivityAt: new Date(now.getTime() - 4 * 60_000),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: now,
      user,
    })

    await expect(authService.authenticate('token', context)).resolves.toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ id: user.id }),
      }),
    )
    expect(repository.refreshSession).not.toHaveBeenCalled()

    repository.findSession.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: user.id,
      expiresAt: new Date(now.getTime() + 30 * 60_000),
      lastActivityAt: new Date(now.getTime() - 5 * 60_000 - 1),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: now,
      user,
    })
    authService.clearAuthenticationCacheForTests()
    await authService.authenticate('token', context)
    expect(repository.refreshSession).toHaveBeenCalledWith(
      expect.any(String),
      now,
      expect.any(Date),
      new Date(now.getTime() - 5 * 60_000),
    )
    vi.useRealTimers()
  })

  it('reutiliza el contexto autenticado breve y lo invalida por usuario', async () => {
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findSession.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60_000),
      lastActivityAt: new Date(Date.now()),
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      user,
    })

    await Promise.all([
      authService.authenticate('token', context),
      authService.authenticate('token', context),
    ])
    expect(repository.findSession).toHaveBeenCalledTimes(1)

    authService.invalidateUserSessions(user.id)
    await authService.authenticate('token', context)
    expect(repository.findSession).toHaveBeenCalledTimes(2)
  })

  it('renueva el identificador de una sesión activa tras cuatro horas', async () => {
    const now = new Date('2026-10-24T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findSession.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: user.id,
      expiresAt: new Date(now.getTime() + 30 * 60_000),
      lastActivityAt: now,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(now.getTime() - 4 * 60 * 60_000 - 1),
      user,
    })
    repository.renewSession.mockResolvedValue({ count: 1 })

    const result = await authService.authenticate('token', context)

    expect(result.renewedToken).toBeTruthy()
    expect(result.tokenHash).not.toBe('a'.repeat(64))
    expect(repository.renewSession).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('revoca una sesión que excede el límite absoluto de ocho horas', async () => {
    const now = new Date('2026-10-24T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const user = userRecord(await hashPassword('Clave-segura-2026'))
    repository.findSession.mockResolvedValue({
      tokenHash: 'a'.repeat(64),
      userId: user.id,
      expiresAt: new Date(now.getTime() + 30 * 60_000),
      lastActivityAt: now,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(now.getTime() - 8 * 60 * 60_000 - 1),
      user,
    })

    await expect(
      authService.authenticate('token', context),
    ).rejects.toMatchObject({ status: 401, code: 'AUTH_SESSION_EXPIRED' })
    expect(repository.expireSession).toHaveBeenCalledOnce()
    vi.useRealTimers()
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
