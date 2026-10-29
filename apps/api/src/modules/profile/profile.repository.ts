import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { NotificationPreferences } from './profile.types.js'

const userProfileInclude = {
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

export type UserProfileRecord = NonNullable<
  Awaited<ReturnType<typeof profileRepository.findProfileById>>
>

export const profileRepository = {
  async findProfileById(userId: string) {
    return databaseService.client.user.findUnique({
      where: { id: userId },
      include: userProfileInclude,
    })
  },

  async updateProfile(
    userId: string,
    displayName: string,
    notificationPreferences: NotificationPreferences,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          displayName,
          notificationPreferences:
            notificationPreferences as unknown as Prisma.InputJsonValue,
        },
        include: userProfileInclude,
      })

      await tx.auditLog.create({
        data: {
          event: 'PROFILE_UPDATED',
          userId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          metadata: {
            displayName,
            notificationPreferences: { ...notificationPreferences },
          } as unknown as Prisma.InputJsonValue,
        },
      })

      return updated
    })
  },

  async updatePassword(
    userId: string,
    passwordHash: string,
    now: Date,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })

      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      })

      await tx.auditLog.create({
        data: {
          event: 'PASSWORD_CHANGED',
          userId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
        },
      })
    })
  },
}
