import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/app-error.js'
import { authRepository, type AuthUserRecord } from './auth.repository.js'
import { hashPassword, verifyPassword } from './password.js'
import { createSessionToken, hashSessionToken } from './session-token.js'
import type { AuthUser, LoginInput, RequestContext } from './auth.types.js'

const invalidCredentials = () =>
  new AppError(
    401,
    'AUTH_INVALID_CREDENTIALS',
    'No se pudo iniciar sesión con las credenciales proporcionadas.',
  )

const dummyPasswordHashPromise = hashPassword('torcly-dummy-password')

function sessionExpiration(now = new Date()) {
  return new Date(now.getTime() + env.SESSION_IDLE_MINUTES * 60 * 1000)
}

function toAuthUser(user: AuthUserRecord): AuthUser {
  const permissions = new Set(
    user.roles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.code),
    ),
  )

  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
    username: user.username,
    permissions: [...permissions].sort(),
  }
}

export const authService = {
  async login(input: LoginInput, context: RequestContext) {
    const identifier = input.identifier.trim().toLowerCase()
    const user = await authRepository.findUserByIdentifier(identifier)

    if (!user) {
      await verifyPassword(input.password, await dummyPasswordHashPromise)
      await authRepository.recordUnknownLoginFailure(identifier, context)
      throw invalidCredentials()
    }

    const now = new Date()
    if (!user.active || (user.lockedUntil && user.lockedUntil > now)) {
      await verifyPassword(input.password, user.passwordHash)
      await authRepository.recordRejectedLogin(user.id, identifier, context)
      throw invalidCredentials()
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    )
    if (!passwordMatches) {
      await authRepository.recordLoginFailure(
        user.id,
        identifier,
        env.LOGIN_MAX_ATTEMPTS,
        new Date(now.getTime() + env.LOGIN_LOCK_MINUTES * 60 * 1000),
        context,
      )
      throw invalidCredentials()
    }

    const token = createSessionToken()
    const authenticatedUser = await authRepository.createSession(
      user.id,
      hashSessionToken(token),
      sessionExpiration(now),
      context,
    )

    return { token, user: toAuthUser(authenticatedUser) }
  },

  async authenticate(token: string, context: RequestContext) {
    const tokenHash = hashSessionToken(token)
    const session = await authRepository.findSession(tokenHash)
    if (!session || session.revokedAt || !session.user.active) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
    }

    const now = new Date()
    if (session.expiresAt <= now) {
      await authRepository.expireSession(tokenHash, session.userId, context)
      throw new AppError(401, 'AUTH_SESSION_EXPIRED', 'La sesión expiró.')
    }

    const refreshed = await authRepository.refreshSession(
      tokenHash,
      now,
      sessionExpiration(now),
    )
    if (refreshed.count !== 1) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
    }

    return { tokenHash, user: toAuthUser(session.user) }
  },

  async logout(tokenHash: string, userId: string, context: RequestContext) {
    await authRepository.revokeSession(tokenHash, userId, context)
  },

  async assertPermission(
    user: AuthUser,
    permission: string,
    context: RequestContext,
  ) {
    if (user.permissions.includes(permission)) return
    await authRepository.recordAccessDenied(user.id, permission, context)
    throw new AppError(
      403,
      'AUTH_FORBIDDEN',
      'No tienes permiso para esta acción.',
    )
  },
}
