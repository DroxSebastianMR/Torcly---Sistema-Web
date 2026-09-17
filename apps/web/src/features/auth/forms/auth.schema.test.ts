import { describe, it, expect } from 'vitest'
import { loginSchema, resetSchema } from './auth.schema'
describe('Validación de autenticación', () => {
  it('rechaza correo inválido y contraseña vacía', () => {
    expect(
      loginSchema.safeParse({ email: 'invalido', password: '' }).success,
    ).toBe(false)
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
