import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../src/modules/auth/password.js'
import {
  createRecoveryToken,
  hashRecoveryToken,
} from '../src/modules/auth/recovery-token.js'
import {
  createSessionToken,
  hashSessionToken,
} from '../src/modules/auth/session-token.js'

describe('Criptografía de autenticación', () => {
  it('genera hashes con salt y verifica únicamente la contraseña correcta', async () => {
    const first = await hashPassword('Una-clave-segura-2026')
    const second = await hashPassword('Una-clave-segura-2026')

    expect(first).not.toBe(second)
    expect(first).not.toContain('Una-clave-segura-2026')
    await expect(verifyPassword('Una-clave-segura-2026', first)).resolves.toBe(
      true,
    )
    await expect(verifyPassword('incorrecta', first)).resolves.toBe(false)
    await expect(verifyPassword('clave', 'hash-invalido')).resolves.toBe(false)
  })

  it('crea tokens aleatorios y almacena solo su huella SHA-256', () => {
    const first = createSessionToken()
    const second = createSessionToken()
    const hash = hashSessionToken(first)

    expect(first).not.toBe(second)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toContain(first)
  })

  it('genera tokens de recuperación aleatorios y almacena solo su huella', () => {
    const first = createRecoveryToken()
    const second = createRecoveryToken()
    const hash = hashRecoveryToken(first)

    expect(first).not.toBe(second)
    expect(first.length).toBeGreaterThanOrEqual(40)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toContain(first)
  })
})
