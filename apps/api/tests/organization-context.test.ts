import { describe, expect, it } from 'vitest'
import { AppError } from '../src/shared/errors/app-error.js'
import {
  requireOrganizationContext,
  requirePlatformAdministrator,
} from '../src/modules/auth/organization-context.js'

describe('Contexto de organización', () => {
  it('devuelve únicamente la organización resuelta desde la sesión', () => {
    expect(
      requireOrganizationContext({
        id: 'user-1',
        name: 'Administradora',
        email: 'admin@taller.test',
        username: 'admin',
        permissions: ['products:read'],
        organization: {
          id: 'org-1',
          code: 'taller-centro',
          name: 'Taller Centro',
        },
      }),
    ).toEqual({
      id: 'org-1',
      code: 'taller-centro',
      name: 'Taller Centro',
    })
  })

  it('rechaza una identidad sin organización activa', () => {
    expect.assertions(1)

    try {
      requireOrganizationContext({
        id: 'platform-admin',
        name: 'Plataforma',
        email: 'platform@torcly.test',
        username: 'platform',
        permissions: [],
        isPlatformAdmin: true,
      })
    } catch (error) {
      expect(error).toMatchObject({
        status: 403,
        code: 'ORGANIZATION_CONTEXT_REQUIRED',
      } satisfies Partial<AppError>)
    }
  })

  it('solo permite la consola interna al administrador de plataforma', () => {
    expect(() =>
      requirePlatformAdministrator({
        id: 'platform-admin',
        name: 'Plataforma',
        email: 'platform@torcly.test',
        username: 'platform',
        permissions: [],
        isPlatformAdmin: true,
      }),
    ).not.toThrow()
  })

  it('rechaza a un administrador de taller para la consola interna', () => {
    expect.assertions(1)

    try {
      requirePlatformAdministrator({
        id: 'owner-1',
        name: 'Dueño',
        email: 'dueno@taller.test',
        username: 'dueno',
        permissions: ['products:read'],
        organization: {
          id: 'org-1',
          code: 'taller-centro',
          name: 'Taller Centro',
        },
      })
    } catch (error) {
      expect(error).toMatchObject({
        status: 403,
        code: 'PLATFORM_ACCESS_FORBIDDEN',
      } satisfies Partial<AppError>)
    }
  })
})
