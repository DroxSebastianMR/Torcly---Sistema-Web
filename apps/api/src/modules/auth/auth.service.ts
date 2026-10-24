import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/app-error.js'
import { authRepository, type AuthUserRecord } from './auth.repository.js'
import { hashPassword, verifyPassword } from './password.js'
import { getPasswordResetNotifier } from './password-reset-notifier.js'
import { createRecoveryToken, hashRecoveryToken } from './recovery-token.js'
import { createSessionToken, hashSessionToken } from './session-token.js'
import type {
  AuthUser,
  LoginInput,
  PasswordRecoveryRequestInput,
  PasswordResetInput,
  RequestContext,
} from './auth.types.js'

const invalidCredentials = () =>
  new AppError(
    401,
    'AUTH_INVALID_CREDENTIALS',
    'No se pudo iniciar sesión con las credenciales proporcionadas.',
  )

const invalidRecoveryToken = () =>
  new AppError(
    400,
    'AUTH_RESET_INVALID',
    'El enlace de recuperación no es válido o expiró.',
  )

const dummyPasswordHashPromise = hashPassword('torcly-dummy-password')
const sessionActivityRefreshIntervalMs = 60_000
const authenticationCacheTtlMs = 10_000
const authenticationCacheLimit = 500

type CachedAuthentication = {
  tokenHash: string
  userId: string
  user: AuthUser
  expiresAt: Date
  lastActivityAt: Date
  cachedAt: number
}

type AuthSessionRecord = NonNullable<
  Awaited<ReturnType<typeof authRepository.findSession>>
>

const authenticationCache = new Map<string, CachedAuthentication>()
const pendingAuthentications = new Map<
  string,
  Promise<CachedAuthentication | null>
>()

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

function rememberAuthentication(
  tokenHash: string,
  session: AuthSessionRecord,
): CachedAuthentication {
  const entry: CachedAuthentication = {
    tokenHash,
    userId: session.userId,
    user: toAuthUser(session.user),
    expiresAt: session.expiresAt,
    lastActivityAt: session.lastActivityAt,
    cachedAt: Date.now(),
  }
  if (authenticationCache.size >= authenticationCacheLimit) {
    const oldest = authenticationCache.keys().next().value
    if (oldest) authenticationCache.delete(oldest)
  }
  authenticationCache.set(tokenHash, entry)
  return entry
}

async function loadAuthentication(
  tokenHash: string,
): Promise<CachedAuthentication | null> {
  const cached = authenticationCache.get(tokenHash)
  if (cached && Date.now() - cached.cachedAt < authenticationCacheTtlMs) {
    return cached
  }

  const pending = pendingAuthentications.get(tokenHash)
  if (pending) return pending

  const lookup = authRepository
    .findSession(tokenHash)
    .then((session) => {
      if (!session || session.revokedAt || !session.user.active) {
        authenticationCache.delete(tokenHash)
        return null
      }
      return rememberAuthentication(tokenHash, session)
    })
    .finally(() => pendingAuthentications.delete(tokenHash))

  pendingAuthentications.set(tokenHash, lookup)
  return lookup
}

function invalidateSession(tokenHash: string) {
  authenticationCache.delete(tokenHash)
  pendingAuthentications.delete(tokenHash)
}

function invalidateUserSessions(userId: string) {
  for (const [tokenHash, entry] of authenticationCache) {
    if (entry.userId === userId) authenticationCache.delete(tokenHash)
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

    const tokenHash = hashSessionToken(token)
    authenticationCache.set(tokenHash, {
      tokenHash,
      userId: authenticatedUser.id,
      user: toAuthUser(authenticatedUser),
      expiresAt: sessionExpiration(now),
      lastActivityAt: now,
      cachedAt: Date.now(),
    })

    return { token, user: toAuthUser(authenticatedUser) }
  },

  async authenticate(token: string, context: RequestContext) {
    const tokenHash = hashSessionToken(token)
    const session = await loadAuthentication(tokenHash)
    if (!session) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
    }

    const now = new Date()
    if (session.expiresAt <= now) {
      invalidateSession(tokenHash)
      await authRepository.expireSession(tokenHash, session.userId, context)
      throw new AppError(401, 'AUTH_SESSION_EXPIRED', 'La sesión expiró.')
    }

    if (
      now.getTime() - session.lastActivityAt.getTime() >=
      sessionActivityRefreshIntervalMs
    ) {
      await authRepository.refreshSession(
        tokenHash,
        now,
        sessionExpiration(now),
        new Date(now.getTime() - sessionActivityRefreshIntervalMs),
      )
      authenticationCache.set(tokenHash, {
        ...session,
        expiresAt: sessionExpiration(now),
        lastActivityAt: now,
        cachedAt: Date.now(),
      })
    }

    return { tokenHash, user: session.user }
  },

  async logout(tokenHash: string, userId: string, context: RequestContext) {
    await authRepository.revokeSession(tokenHash, userId, context)
    invalidateSession(tokenHash)
  },

  async requestPasswordRecovery(
    input: PasswordRecoveryRequestInput,
    context: RequestContext,
  ) {
    const identifier = input.identifier.trim().toLowerCase()
    const user = await authRepository.findUserByIdentifier(identifier)

    if (!user || !user.active) return

    const token = createRecoveryToken()
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
    )
    await authRepository.recordPasswordResetRequested(
      user.id,
      hashRecoveryToken(token),
      expiresAt,
      context,
    )
    await getPasswordResetNotifier().send({
      to: user.email,
      token,
      expiresAt,
      requestId: context.requestId,
    })
  },

  async resetPassword(input: PasswordResetInput, context: RequestContext) {
    const tokenHash = hashRecoveryToken(input.token)
    const record = await authRepository.findPasswordResetToken(tokenHash)
    const now = new Date()

    if (
      !record ||
      record.consumedAt ||
      record.expiresAt <= now ||
      !record.user.active
    ) {
      throw invalidRecoveryToken()
    }

    const passwordHash = await hashPassword(input.password)
    const result = await authRepository.consumePasswordResetToken(
      tokenHash,
      passwordHash,
      now,
      context,
    )
    if (!result.consumed) throw invalidRecoveryToken()
    invalidateUserSessions(record.userId)
  },

  invalidateUserSessions,

  clearAuthenticationCacheForTests() {
    authenticationCache.clear()
    pendingAuthentications.clear()
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
