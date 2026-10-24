import { describe, expect, it } from 'vitest'
import {
  changePasswordSchema,
  profileIdParamSchema,
  updateProfileSchema,
} from '../src/modules/profile/profile.schemas.js'

describe('profileIdParamSchema', () => {
  it('acepta id uuid válido', () => {
    const result = profileIdParamSchema.parse({
      id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    })
    expect(result.id).toBe('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d')
  })

  it('acepta objeto vacío sin id', () => {
    const result = profileIdParamSchema.parse({})
    expect(result.id).toBeUndefined()
  })

  it('rechaza id que no es uuid', () => {
    expect(() => profileIdParamSchema.parse({ id: 'no-uuid' })).toThrow()
  })
})

describe('updateProfileSchema', () => {
  it('acepta displayName válido', () => {
    const result = updateProfileSchema.parse({
      displayName: 'Carlos Pérez',
    })
    expect(result.displayName).toBe('Carlos Pérez')
    expect(result.notificationPreferences).toBeUndefined()
  })

  it('acepta displayName y preferencias de notificación válidas', () => {
    const result = updateProfileSchema.parse({
      displayName: 'Carlos Pérez',
      notificationPreferences: {
        stockLow: true,
        purchaseReceived: false,
      },
    })
    expect(result.displayName).toBe('Carlos Pérez')
    expect(result.notificationPreferences?.purchaseReceived).toBe(false)
  })

  it('rechaza nombre con menos de 2 caracteres', () => {
    expect(() =>
      updateProfileSchema.parse({
        displayName: 'A',
      }),
    ).toThrow(/al menos 2 caracteres/)
  })

  it('rechaza claves desconocidas', () => {
    expect(() =>
      updateProfileSchema.parse({
        displayName: 'Carlos Pérez',
        inyeccion: true,
      }),
    ).toThrow()
  })
})

describe('changePasswordSchema', () => {
  it('acepta contraseña actual y nueva válida', () => {
    const result = changePasswordSchema.parse({
      currentPassword: 'Password123!',
      newPassword: 'NewStrongPassword456!',
    })
    expect(result.currentPassword).toBe('Password123!')
    expect(result.newPassword).toBe('NewStrongPassword456!')
  })

  it('rechaza nueva contraseña menor a 8 caracteres', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'Password123!',
        newPassword: 'short',
      }),
    ).toThrow(/al menos 8 caracteres/)
  })

  it('rechaza contraseña actual vacía', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: '',
        newPassword: 'NewStrongPassword456!',
      }),
    ).toThrow()
  })

  it('rechaza propiedades desconocidas', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'Password123!',
        newPassword: 'NewStrongPassword456!',
        hack: true,
      }),
    ).toThrow()
  })
})
