import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from './auth.types.js'

const authUserInclude = {
  roles: {
    where: { role: { active: true } },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: { select: { code: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude

const auditData = (
  event: AuditEventType,
  context: RequestContext,
  data: {
    userId?: string
    identifier?: string
    metadata?: Prisma.InputJsonValue
  },
) => ({
  event,
  userId: data.userId,
  identifier: data.identifier,
  requestId: context.requestId,
  ipAddress: context.ipAddress,
  metadata: data.metadata,
})

export const authRepository = {
  findUserByIdentifier(identifier: string) {
    return databaseService.client.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: authUserInclude,
    })
  },

  recordUnknownLoginFailure(identifier: string, context: RequestContext) {
    return databaseService.client.auditLog.create({
      data: auditData('LOGIN_FAILURE', context, { identifier }),
    })
  },

  recordLoginFailure(
    userId: string,
    identifier: string,
    maximumAttempts: number,
    lockUntil: Date,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      })
      const locked = user.failedLoginAttempts >= maximumAttempts
      if (locked) {
        await transaction.user.update({
          where: { id: userId },
          data: { lockedUntil: lockUntil },
        })
      }
      await transaction.auditLog.create({
        data: auditData(locked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILURE', context, {
          userId,
          identifier,
          metadata: { failedLoginAttempts: user.failedLoginAttempts },
        }),
      })
      return { failedLoginAttempts: user.failedLoginAttempts, locked }
    })
  },

  recordRejectedLogin(
    userId: string,
    identifier: string,
    context: RequestContext,
  ) {
    return databaseService.client.auditLog.create({
      data: auditData('LOGIN_FAILURE', context, { userId, identifier }),
    })
  },

  createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0, lockedUntil: null },
        include: authUserInclude,
      })
      await transaction.authSession.create({
        data: {
          tokenHash,
          userId,
          expiresAt,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      })
      await transaction.auditLog.create({
        data: auditData('LOGIN_SUCCESS', context, { userId }),
      })
      return user
    })
  },

  findSession(tokenHash: string) {
    return databaseService.client.authSession.findUnique({
      where: { tokenHash },
      include: { user: { include: authUserInclude } },
    })
  },

  refreshSession(tokenHash: string, now: Date, expiresAt: Date) {
    return databaseService.client.authSession.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      data: { lastActivityAt: now, expiresAt },
    })
  },

  expireSession(tokenHash: string, userId: string, context: RequestContext) {
    const now = new Date()
    return databaseService.transaction(async (transaction) => {
      await transaction.authSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: now },
      })
      await transaction.auditLog.create({
        data: auditData('SESSION_EXPIRED', context, { userId }),
      })
    })
  },

  revokeSession(tokenHash: string, userId: string, context: RequestContext) {
    const now = new Date()
    return databaseService.transaction(async (transaction) => {
      await transaction.authSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: now },
      })
      await transaction.auditLog.create({
        data: auditData('LOGOUT', context, { userId }),
      })
    })
  },

  recordAccessDenied(
    userId: string,
    permission: string,
    context: RequestContext,
  ) {
    return databaseService.client.auditLog.create({
      data: auditData('ACCESS_DENIED', context, {
        userId,
        metadata: { permission },
      }),
    })
  },
}

export type AuthUserRecord = NonNullable<
  Awaited<ReturnType<typeof authRepository.findUserByIdentifier>>
>
