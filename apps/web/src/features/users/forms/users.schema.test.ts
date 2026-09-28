import { describe, expect, it } from 'vitest'
import { userCreateSchema, userProfileSchema } from './users.schema'

const validCreate = {
  username: 'jperez',
  email: 'jperez@torcly.local',
  displayName: 'Juan Pérez',
  password: 'Clave-segura-123',
  roleId: '3f0d0d5a-2b8a-4c19-9d3e-4f1b2c3d4e5f',
}

describe('Validación de usuarios', () => {
  it('acepta datos válidos para crear un usuario', () => {
    expect(userCreateSchema.safeParse(validCreate).success).toBe(true)
  })

  it('rechaza contraseña corta y sin rol', () => {
    expect(
      userCreateSchema.safeParse({ ...validCreate, password: 'corta' }).success,
    ).toBe(false)
    expect(
      userCreateSchema.safeParse({ ...validCreate, roleId: '' }).success,
    ).toBe(false)
  })

  it('rechaza nombre de usuario con espacios o caracteres inválidos', () => {
    expect(
      userCreateSchema.safeParse({
        ...validCreate,
        username: 'juan perez',
      }).success,
    ).toBe(false)
    expect(
      userCreateSchema.safeParse({ ...validCreate, username: '@juan' }).success,
    ).toBe(false)
  })

  it('rechaza correo inválido y nombre demasiado corto', () => {
    expect(
      userCreateSchema.safeParse({
        ...validCreate,
        email: 'correo-invalido',
      }).success,
    ).toBe(false)
    expect(
      userCreateSchema.safeParse({ ...validCreate, displayName: 'A' }).success,
    ).toBe(false)
  })

  it('valida la edición del perfil (correo y nombre visible)', () => {
    expect(
      userProfileSchema.safeParse({
        email: 'otro@torcly.local',
        displayName: 'Nuevo Nombre',
      }).success,
    ).toBe(true)
    expect(
      userProfileSchema.safeParse({
        email: 'no-correo',
        displayName: 'N',
      }).success,
    ).toBe(false)
  })
})
