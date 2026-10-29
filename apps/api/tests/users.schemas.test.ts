import { describe, expect, it } from 'vitest'
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  userRoleSchema,
} from '../src/modules/users/users.schemas.js'

const roleId = '3f0d0d5a-2b8a-4c19-9d3e-4f1b2c3d4e5f'

const validCreate = {
  username: 'Admin',
  email: 'Admin@Torcly.Local',
  displayName: 'Administrador',
  password: 'Clave-segura-123',
  roleId,
}

describe('Schemas de usuarios', () => {
  it('normaliza usuario y correo a minúsculas al crear', () => {
    const result = createUserSchema.parse(validCreate)
    expect(result.username).toBe('admin')
    expect(result.email).toBe('admin@torcly.local')
  })

  it('rechaza el registro con correo inválido y contraseña corta', () => {
    const email = createUserSchema.safeParse({
      ...validCreate,
      email: 'correo-invalido',
    })
    const password = createUserSchema.safeParse({
      ...validCreate,
      password: 'corta',
    })
    expect(email.success).toBe(false)
    expect(password.success).toBe(false)
  })

  it('rechaza usuario con espacios o sin rol', () => {
    const username = createUserSchema.safeParse({
      ...validCreate,
      username: 'admin usuario',
    })
    const role = createUserSchema.safeParse({
      ...validCreate,
      roleId: '',
    })
    expect(username.success).toBe(false)
    expect(role.success).toBe(false)
  })

  it('aplica valores por defecto al listado', () => {
    expect(userQuerySchema.parse({})).toEqual({
      search: undefined,
      status: 'all',
      page: 1,
      pageSize: 20,
    })
  })

  it('valida la actualización de datos permitidos', () => {
    expect(
      updateUserSchema.parse({
        email: 'Otro@Torcly.Local',
        displayName: 'Nombre nuevo',
      }),
    ).toEqual({ email: 'otro@torcly.local', displayName: 'Nombre nuevo' })
    expect(
      updateUserSchema.safeParse({ email: 'no-correo', displayName: 'A' })
        .success,
    ).toBe(false)
  })

  it('exige rol válido para el cambio de rol', () => {
    expect(userRoleSchema.safeParse({ roleId }).success).toBe(true)
    expect(userRoleSchema.safeParse({ roleId: 'no-uuid' }).success).toBe(false)
  })
})
