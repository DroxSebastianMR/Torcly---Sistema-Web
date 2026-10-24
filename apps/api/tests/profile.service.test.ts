import { describe, expect, it, vi, beforeEach } from 'vitest'
import { profileService } from '../src/modules/profile/profile.service.js'
import {
  profileRepository,
  type UserProfileRecord,
} from '../src/modules/profile/profile.repository.js'
import { hashPassword } from '../src/modules/auth/password.js'
import { authService } from '../src/modules/auth/auth.service.js'

vi.mock('../src/modules/profile/profile.repository.js')
vi.mock('../src/modules/auth/auth.service.js')

const dummyAuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Usuario Prueba',
  email: 'prueba@torcly.com',
  username: 'prueba',
  permissions: ['profile:read'],
}

const dummyContext = {
  requestId: 'req-123',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
}

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assertOwnProfile (Aislamiento entre usuarios)', () => {
    it('permite acceso si targetId es undefined', () => {
      expect(() =>
        profileService.assertOwnProfile(undefined, dummyAuthUser.id),
      ).not.toThrow()
    })

    it('permite acceso si targetId coincide con el usuario autenticado', () => {
      expect(() =>
        profileService.assertOwnProfile(dummyAuthUser.id, dummyAuthUser.id),
      ).not.toThrow()
    })

    it('rechaza con 403 PROFILE_FORBIDDEN si targetId es de otro usuario', () => {
      expect(() =>
        profileService.assertOwnProfile(
          '99999999-9999-4999-8999-999999999999',
          dummyAuthUser.id,
        ),
      ).toThrowError(/No tienes permiso para acceder al perfil de otro usuario/)
    })
  })

  describe('getProfile', () => {
    it('obtiene perfil con roles, permisos y preferencias por defecto', async () => {
      vi.mocked(profileRepository.findProfileById).mockResolvedValueOnce({
        id: dummyAuthUser.id,
        username: 'prueba',
        email: 'prueba@torcly.com',
        displayName: 'Usuario Prueba',
        passwordHash: 'dummy',
        active: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        notificationPreferences: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        roles: [
          {
            id: 'r1',
            userId: dummyAuthUser.id,
            roleId: 'role-1',
            createdAt: new Date(),
            role: {
              id: 'role-1',
              code: 'ADMIN',
              name: 'Administrador',
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              permissions: [
                {
                  id: 'p1',
                  roleId: 'role-1',
                  permissionId: 'perm-1',
                  permission: { code: 'profile:read' },
                },
              ],
            },
          },
        ],
      } as unknown as UserProfileRecord)

      const profile = await profileService.getProfile(undefined, dummyAuthUser)

      expect(profile.id).toBe(dummyAuthUser.id)
      expect(profile.displayName).toBe('Usuario Prueba')
      expect(profile.permissions).toContain('profile:read')
      expect(profile.notificationPreferences.stockLow).toBe(true)
      expect(profile.notificationPreferences.purchaseReceived).toBe(true)
    })

    it('rechaza si intenta consultar el perfil de otro usuario por URL', async () => {
      await expect(
        profileService.getProfile(
          '22222222-2222-4222-8222-222222222222',
          dummyAuthUser,
        ),
      ).rejects.toThrow(
        /No tienes permiso para acceder al perfil de otro usuario/,
      )
    })
  })

  describe('updateProfile', () => {
    it('rechaza edición de perfil ajeno por URL/API', async () => {
      await expect(
        profileService.updateProfile(
          '22222222-2222-4222-8222-222222222222',
          dummyAuthUser,
          { displayName: 'Hacker' },
          dummyContext,
        ),
      ).rejects.toThrow(
        /No tienes permiso para acceder al perfil de otro usuario/,
      )
    })

    it('actualiza el perfil propio y guarda preferencias', async () => {
      vi.mocked(profileRepository.findProfileById).mockResolvedValueOnce({
        id: dummyAuthUser.id,
        notificationPreferences: { stockLow: false },
      } as unknown as UserProfileRecord)

      vi.mocked(profileRepository.updateProfile).mockResolvedValueOnce({
        id: dummyAuthUser.id,
        username: 'prueba',
        email: 'prueba@torcly.com',
        displayName: 'Nuevo Nombre',
        notificationPreferences: { stockLow: false, purchaseReceived: false },
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
      } as unknown as UserProfileRecord)

      const result = await profileService.updateProfile(
        dummyAuthUser.id,
        dummyAuthUser,
        {
          displayName: 'Nuevo Nombre',
          notificationPreferences: { purchaseReceived: false },
        },
        dummyContext,
      )

      expect(result.displayName).toBe('Nuevo Nombre')
      expect(profileRepository.updateProfile).toHaveBeenCalledWith(
        dummyAuthUser.id,
        'Nuevo Nombre',
        expect.objectContaining({
          stockLow: false,
          purchaseReceived: false,
        }),
        dummyContext,
      )
    })
  })

  describe('changePassword', () => {
    it('falla con 400 si la contraseña actual es errónea', async () => {
      const realHash = await hashPassword('CorrectPassword123!')
      vi.mocked(profileRepository.findProfileById).mockResolvedValueOnce({
        id: dummyAuthUser.id,
        passwordHash: realHash,
      } as unknown as UserProfileRecord)

      await expect(
        profileService.changePassword(
          dummyAuthUser,
          {
            currentPassword: 'WrongPassword!',
            newPassword: 'BrandNewPassword123!',
          },
          dummyContext,
        ),
      ).rejects.toThrowError(/La contraseña actual no es correcta/)

      expect(profileRepository.updatePassword).not.toHaveBeenCalled()
    })

    it('actualiza contraseña e invalida sesiones si la contraseña actual es correcta', async () => {
      const realHash = await hashPassword('CurrentPassword123!')
      vi.mocked(profileRepository.findProfileById).mockResolvedValueOnce({
        id: dummyAuthUser.id,
        passwordHash: realHash,
      } as unknown as UserProfileRecord)

      const result = await profileService.changePassword(
        dummyAuthUser,
        {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'BrandNewPassword123!',
        },
        dummyContext,
      )

      expect(result.status).toBe('ok')
      expect(profileRepository.updatePassword).toHaveBeenCalledTimes(1)
      expect(authService.invalidateUserSessions).toHaveBeenCalledWith(
        dummyAuthUser.id,
      )
    })
  })
})
