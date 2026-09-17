import { describe, expect, it } from 'vitest'
import { recoverySchema } from './auth.schema'

describe('Identificador de recuperación', () => {
  it.each([
    'smercado',
    'sebastian.mercado',
    'persona@gmail.com',
    'persona@empresa.com.pe',
  ])('acepta %s', (identifier) => {
    expect(recoverySchema.safeParse({ identifier }).success).toBe(true)
  })
  it.each([
    '',
    '   ',
    'usuario con espacios',
    'persona@',
    '@empresa.com',
    'persona@empresa',
    'a'.repeat(255),
  ])('rechaza un identificador inválido', (identifier) => {
    expect(recoverySchema.safeParse({ identifier }).success).toBe(false)
  })
  it('elimina espacios exteriores sin modificar el identificador', () => {
    expect(
      recoverySchema.parse({ identifier: '  Usuario.Test  ' }).identifier,
    ).toBe('Usuario.Test')
  })
})
