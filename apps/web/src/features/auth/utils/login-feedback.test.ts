import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getLoginFeedback } from './login-feedback'

function loginError(
  code: string,
  details: Record<string, unknown>,
  status = 401,
) {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      data: { error: { code, details } },
      status,
      statusText: '',
      headers: {},
      config: { headers: undefined as never } as never,
    },
  )
}

describe('Mensajes de intentos de acceso', () => {
  it('informa los intentos restantes devueltos por el servidor', () => {
    expect(
      getLoginFeedback(
        loginError('AUTH_INVALID_CREDENTIALS', {
          attemptsRemaining: 2,
          lockMinutes: 15,
        }),
      ),
    ).toEqual({
      title: 'Contraseña incorrecta',
      description:
        'Te quedan 2 intentos antes del bloqueo temporal de 15 minutos.',
    })
  })

  it('informa el bloqueo temporal sin mostrar detalles internos', () => {
    const feedback = getLoginFeedback(
      loginError(
        'AUTH_LOGIN_LOCKED',
        { maximumAttempts: 5, lockMinutes: 15 },
        429,
      ),
    )
    expect(feedback.title).toBe('Inicio de sesión bloqueado')
    expect(feedback.description).toContain('5 intentos')
    expect(feedback.description).toContain('15 minutos')
  })
})
