import { describe, expect, it } from 'vitest'
import {
  createPlatformOrganizationMemberSchema,
  createPlatformOrganizationSchema,
  platformOrganizationQuerySchema,
  updatePlatformOrganizationSchema,
  updatePlatformOrganizationMemberSchema,
  updatePlatformOrganizationStatusSchema,
} from '../src/modules/platform/platform.schemas.js'

const roleId = 'a0000000-0000-4000-8000-000000000001'

describe('Schemas de administración de plataforma', () => {
  it('normaliza filtros de organizaciones y usa paginación segura', () => {
    expect(platformOrganizationQuerySchema.parse({})).toEqual({
      status: 'all',
      page: 1,
      pageSize: 10,
    })

    expect(
      platformOrganizationQuerySchema.parse({
        search: ' Taller Norte ',
        status: 'active',
        page: '2',
        pageSize: '20',
      }),
    ).toEqual({
      search: 'Taller Norte',
      status: 'active',
      page: 2,
      pageSize: 20,
    })
  })

  it('crea una organización con credenciales normalizadas para su responsable', () => {
    expect(
      createPlatformOrganizationSchema.parse({
        code: 'Taller-Norte',
        name: 'Taller Norte',
        owner: {
          displayName: 'María Torres',
          email: 'MARIA@TALLER.TEST',
          username: 'Maria.Torres',
          password: 'segura123',
          roleId,
        },
      }),
    ).toEqual({
      code: 'taller-norte',
      name: 'Taller Norte',
      owner: {
        displayName: 'María Torres',
        email: 'maria@taller.test',
        username: 'maria.torres',
        password: 'segura123',
        roleId,
      },
    })
  })

  it('rechaza un código inseguro, una clave corta o un rol inválido', () => {
    const input = {
      code: 'Taller Norte',
      name: 'Taller Norte',
      owner: {
        displayName: 'María Torres',
        email: 'maria@taller.test',
        username: 'maria',
        password: 'corta',
        roleId: 'no-es-uuid',
      },
    }

    expect(() => createPlatformOrganizationSchema.parse(input)).toThrow()
  })

  it('normaliza las credenciales de un miembro del taller', () => {
    expect(
      createPlatformOrganizationMemberSchema.parse({
        displayName: '  Diego Flores ',
        email: 'DIEGO@TALLER.TEST',
        username: 'Diego.Flores',
        password: 'segura123',
        roleId,
      }),
    ).toEqual({
      displayName: 'Diego Flores',
      email: 'diego@taller.test',
      username: 'diego.flores',
      password: 'segura123',
      roleId,
    })
  })

  it('exige un cambio válido al actualizar una organización o miembro', () => {
    expect(
      updatePlatformOrganizationStatusSchema.parse({ active: false }),
    ).toEqual({
      active: false,
    })
    expect(
      updatePlatformOrganizationMemberSchema.parse({ active: false }),
    ).toEqual({ active: false })
    expect(() => updatePlatformOrganizationMemberSchema.parse({})).toThrow()
  })

  it('normaliza los datos editables de una organización', () => {
    expect(
      updatePlatformOrganizationSchema.parse({
        code: ' Taller-Centro ',
        name: ' Taller Centro ',
        ownerRoleId: roleId,
      }),
    ).toEqual({
      code: 'taller-centro',
      name: 'Taller Centro',
      ownerRoleId: roleId,
    })

    expect(
      updatePlatformOrganizationSchema.parse({
        code: ' Taller-Centro ',
        name: ' Taller Centro ',
        ownerRoleId: roleId,
        ownerName: ' Carlos Gómez ',
        ownerEmail: 'CARLOS@TALLER.COM',
      }),
    ).toEqual({
      code: 'taller-centro',
      name: 'Taller Centro',
      ownerRoleId: roleId,
      ownerName: 'Carlos Gómez',
      ownerEmail: 'carlos@taller.com',
    })
  })
})
