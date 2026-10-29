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

const invalidCredentials = (attemptsRemaining?: number) =>
  new AppError(
    401,
    'AUTH_INVALID_CREDENTIALS',
    'No se pudo iniciar sesión con las credenciales proporcionadas.',
    attemptsRemaining === undefined
      ? undefined
      : {
          attemptsRemaining,
          maximumAttempts: env.LOGIN_MAX_ATTEMPTS,
          lockMinutes: env.LOGIN_LOCK_MINUTES,
        },
  )

const loginLocked = (lockedUntil: Date) =>
  new AppError(
    429,
    'AUTH_LOGIN_LOCKED',
    'El inicio de sesión está bloqueado temporalmente.',
    {
      lockedUntil: lockedUntil.toISOString(),
      lockMinutes: env.LOGIN_LOCK_MINUTES,
      maximumAttempts: env.LOGIN_MAX_ATTEMPTS,
    },
  )

const invalidRecoveryToken = () =>
  new AppError(
    400,
    'AUTH_RESET_INVALID',
    'El enlace de recuperación no es válido o expiró.',
  )

const dummyPasswordHashPromise = hashPassword('torcly-dummy-password')
const sessionActivityRefreshIntervalMs =
  env.SESSION_ACTIVITY_REFRESH_MINUTES * 60_000
const sessionTokenRenewalIntervalMs =
  env.SESSION_TOKEN_RENEWAL_HOURS * 60 * 60_000
const authenticationCacheTtlMs = env.SESSION_AUTH_CACHE_SECONDS * 1000
const sessionRenewalGracePeriodMs = 10_000
const authenticationCacheLimit = 500

type CachedAuthentication = {
  tokenHash: string
  userId: string
  user: AuthUser
  expiresAt: Date
  lastActivityAt: Date
  createdAt: Date
  tokenRenewedAt: number
  cachedAt: number
}

type SessionReplacement = CachedAuthentication & {
  renewedToken: string
  replacedAt: number
}

type AuthSessionRecord = NonNullable<
  Awaited<ReturnType<typeof authRepository.findSession>>
>

const authenticationCache = new Map<string, CachedAuthentication>()
const sessionReplacements = new Map<string, SessionReplacement>()
const sessionTokenRenewals = new Map<string, number>()
const pendingAuthentications = new Map<
  string,
  Promise<CachedAuthentication | null>
>()

function absoluteSessionExpiration(createdAt: Date) {
  return new Date(
    createdAt.getTime() + env.SESSION_ABSOLUTE_HOURS * 60 * 60_000,
  )
}

function sessionExpiration(now = new Date(), createdAt = now) {
  return new Date(
    Math.min(
      now.getTime() + env.SESSION_IDLE_MINUTES * 60_000,
      absoluteSessionExpiration(createdAt).getTime(),
    ),
  )
}

function getSessionReplacement(tokenHash: string) {
  const replacement = sessionReplacements.get(tokenHash)
  if (!replacement) return null
  if (Date.now() - replacement.replacedAt > sessionRenewalGracePeriodMs) {
    sessionReplacements.delete(tokenHash)
    return null
  }
  return replacement
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
    createdAt: session.createdAt,
    tokenRenewedAt:
      sessionTokenRenewals.get(tokenHash) ?? session.createdAt.getTime(),
    cachedAt: Date.now(),
  }
  if (authenticationCache.size >= authenticationCacheLimit) {
    const oldest = authenticationCache.keys().next().value
    if (oldest) authenticationCache.delete(oldest)
  }
  if (sessionTokenRenewals.size >= authenticationCacheLimit) {
    const oldest = sessionTokenRenewals.keys().next().value
    if (oldest) sessionTokenRenewals.delete(oldest)
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
  sessionReplacements.delete(tokenHash)
  sessionTokenRenewals.delete(tokenHash)
}

function invalidateUserSessions(userId: string) {
  for (const [tokenHash, entry] of authenticationCache) {
    if (entry.userId === userId) {
      authenticationCache.delete(tokenHash)
      sessionTokenRenewals.delete(tokenHash)
    }
  }
  for (const [tokenHash, replacement] of sessionReplacements) {
    if (replacement.userId === userId) sessionReplacements.delete(tokenHash)
  }
  for (const [tokenHash, entry] of authenticationCache) {
    if (entry.userId === userId) sessionTokenRenewals.delete(tokenHash)
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
    if (!user.active) {
      await verifyPassword(input.password, user.passwordHash)
      await authRepository.recordRejectedLogin(user.id, identifier, context)
      throw invalidCredentials()
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      await verifyPassword(input.password, user.passwordHash)
      await authRepository.recordRejectedLogin(user.id, identifier, context)
      throw loginLocked(user.lockedUntil)
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    )
    if (!passwordMatches) {
      const lockUntil = new Date(
        now.getTime() + env.LOGIN_LOCK_MINUTES * 60 * 1000,
      )
      const failure = await authRepository.recordLoginFailure(
        user.id,
        identifier,
        env.LOGIN_MAX_ATTEMPTS,
        lockUntil,
        context,
      )
      if (failure.locked) throw loginLocked(lockUntil)
      throw invalidCredentials(
        Math.max(0, env.LOGIN_MAX_ATTEMPTS - failure.failedLoginAttempts),
      )
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
      createdAt: now,
      tokenRenewedAt: now.getTime(),
      cachedAt: Date.now(),
    })

    return { token, user: toAuthUser(authenticatedUser) }
  },

  async authenticate(token: string, context: RequestContext) {
    const tokenHash = hashSessionToken(token)
    const replacement = getSessionReplacement(tokenHash)
    if (replacement) {
      return {
        tokenHash: replacement.tokenHash,
        renewedToken: replacement.renewedToken,
        user: replacement.user,
      }
    }

    const session = await loadAuthentication(tokenHash)
    if (!session) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
    }

    const now = new Date()
    if (
      session.expiresAt <= now ||
      absoluteSessionExpiration(session.createdAt) <= now
    ) {
      invalidateSession(tokenHash)
      await authRepository.expireSession(tokenHash, session.userId, context)
      throw new AppError(401, 'AUTH_SESSION_EXPIRED', 'La sesión expiró.')
    }

    const expiresAt = sessionExpiration(now, session.createdAt)
    if (
      now.getTime() - session.tokenRenewedAt >=
      sessionTokenRenewalIntervalMs
    ) {
      const renewedToken = createSessionToken()
      const renewedTokenHash = hashSessionToken(renewedToken)
      const renewed = await authRepository.renewSession(
        tokenHash,
        renewedTokenHash,
        now,
        expiresAt,
      )

      if (renewed.count === 1) {
        const renewedSession: CachedAuthentication = {
          ...session,
          tokenHash: renewedTokenHash,
          expiresAt,
          lastActivityAt: now,
          tokenRenewedAt: now.getTime(),
          cachedAt: Date.now(),
        }
        authenticationCache.delete(tokenHash)
        sessionTokenRenewals.delete(tokenHash)
        authenticationCache.set(renewedTokenHash, renewedSession)
        sessionTokenRenewals.set(
          renewedTokenHash,
          renewedSession.tokenRenewedAt,
        )
        sessionReplacements.set(tokenHash, {
          ...renewedSession,
          renewedToken,
          replacedAt: Date.now(),
        })

        return {
          tokenHash: renewedTokenHash,
          renewedToken,
          user: renewedSession.user,
        }
      }

      const concurrentReplacement = getSessionReplacement(tokenHash)
      if (concurrentReplacement) {
        return {
          tokenHash: concurrentReplacement.tokenHash,
          renewedToken: concurrentReplacement.renewedToken,
          user: concurrentReplacement.user,
        }
      }
    }

    if (
      now.getTime() - session.lastActivityAt.getTime() >=
      sessionActivityRefreshIntervalMs
    ) {
      await authRepository.refreshSession(
        tokenHash,
        now,
        expiresAt,
        new Date(now.getTime() - sessionActivityRefreshIntervalMs),
      )
      authenticationCache.set(tokenHash, {
        ...session,
        expiresAt,
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
    sessionReplacements.clear()
    sessionTokenRenewals.clear()
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
