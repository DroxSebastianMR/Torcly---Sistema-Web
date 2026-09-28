import { describe, it, expect } from 'vitest'
import { loginSchema, resetSchema } from './auth.schema'
describe('Validación de autenticación', () => {
  it('rechaza identificador inválido y contraseña vacía', () => {
    expect(
      loginSchema.safeParse({ identifier: 'nombre @correo', password: '' })
        .success,
    ).toBe(false)
  })
  it('acepta usuario o correo como identificador', () => {
    expect(
      loginSchema.safeParse({ identifier: 'administrador', password: 'x' })
        .success,
    ).toBe(true)
    expect(
      loginSchema.safeParse({ identifier: 'admin@torcly.local', password: 'x' })
        .success,
    ).toBe(true)
  })
  it('rechaza confirmación diferente', () => {
    expect(
      resetSchema.safeParse({
        password: 'clave1234',
        confirmPassword: 'otra1234',
      }).success,
    ).toBe(false)
  })
  it('acepta contraseñas válidas coincidentes', () => {
    expect(
      resetSchema.safeParse({
        password: 'clave1234',
        confirmPassword: 'clave1234',
      }).success,
    ).toBe(true)
  })
})
