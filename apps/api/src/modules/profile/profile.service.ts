import { AppError } from '../../shared/errors/app-error.js'
import type { AuthUser, RequestContext } from '../auth/auth.types.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { authService } from '../auth/auth.service.js'
import {
  profileRepository,
  type UserProfileRecord,
} from './profile.repository.js'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type ChangePasswordInput,
  type NotificationPreferences,
  type ProfileResponse,
  type UpdateProfileInput,
} from './profile.types.js'

function toProfileResponse(record: UserProfileRecord): ProfileResponse {
  const permissions = new Set(
    record.roles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.code),
    ),
  )

  const storedPreferences =
    (record.notificationPreferences as Partial<NotificationPreferences> | null) ??
    {}

  const notificationPreferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...storedPreferences,
  }

  return {
    id: record.id,
    username: record.username,
    email: record.email,
    displayName: record.displayName,
    roles: record.roles.map(({ role }) => ({
      id: role.id,
      code: role.code,
      name: role.name,
    })),
    permissions: [...permissions].sort(),
    notificationPreferences,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export const profileService = {
  assertOwnProfile(targetUserId: string | undefined, authUserId: string) {
    if (targetUserId && targetUserId !== authUserId) {
      throw new AppError(
        403,
        'PROFILE_FORBIDDEN',
        'No tienes permiso para acceder al perfil de otro usuario.',
      )
    }
  },

  async getProfile(
    targetUserId: string | undefined,
    authUser: AuthUser,
  ): Promise<ProfileResponse> {
    this.assertOwnProfile(targetUserId, authUser.id)
    const user = await profileRepository.findProfileById(authUser.id)
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
    }
    return toProfileResponse(user)
  },

  async updateProfile(
    targetUserId: string | undefined,
    authUser: AuthUser,
    input: UpdateProfileInput,
    context: RequestContext,
  ): Promise<ProfileResponse> {
    this.assertOwnProfile(targetUserId, authUser.id)

    const existing = await profileRepository.findProfileById(authUser.id)
    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
    }

    const currentPreferences =
      (existing.notificationPreferences as Partial<NotificationPreferences> | null) ??
      {}

    const updatedPreferences: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...currentPreferences,
      ...(input.notificationPreferences ?? {}),
    }

    const updated = await profileRepository.updateProfile(
      authUser.id,
      input.displayName,
      updatedPreferences,
      context,
    )

    return toProfileResponse(updated)
  },

  async changePassword(
    authUser: AuthUser,
    input: ChangePasswordInput,
    context: RequestContext,
  ): Promise<{ status: string; message: string }> {
    const existing = await profileRepository.findProfileById(authUser.id)
    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
    }

    const matches = await verifyPassword(
      input.currentPassword,
      existing.passwordHash,
    )
    if (!matches) {
      throw new AppError(
        400,
        'AUTH_INVALID_PASSWORD',
        'La contraseña actual no es correcta.',
      )
    }

    const newHash = await hashPassword(input.newPassword)
    await profileRepository.updatePassword(
      authUser.id,
      newHash,
      new Date(),
      context,
    )
    authService.invalidateUserSessions(authUser.id)

    return {
      status: 'ok',
      message: 'Contraseña actualizada correctamente.',
    }
  },
}
