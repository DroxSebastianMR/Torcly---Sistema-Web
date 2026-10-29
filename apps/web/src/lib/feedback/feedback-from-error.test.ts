import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getFeedbackKindFromError } from './feedback-from-error'

function httpError(status: number): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      data: undefined,
      status,
      statusText: '',
      headers: {},
      config: { headers: undefined as never } as never,
    },
  )
}

describe('getFeedbackKindFromError', () => {
  it('clasifica la ausencia de respuesta como error de conexión', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(getFeedbackKindFromError(error)).toBe('connection')
  })

  it('clasifica HTTP 401 como sesión vencida', () => {
    expect(getFeedbackKindFromError(httpError(401))).toBe('session-expired')
  })

  it('clasifica HTTP 403 como acceso denegado', () => {
    expect(getFeedbackKindFromError(httpError(403))).toBe('permission-denied')
  })

  it('clasifica HTTP 404 como recurso inexistente', () => {
    expect(getFeedbackKindFromError(httpError(404))).toBe('not-found')
  })

  it('clasifica cualquier otro error como error inesperado', () => {
    expect(getFeedbackKindFromError(httpError(500))).toBe('unexpected')
    expect(getFeedbackKindFromError(new Error('genérico'))).toBe('unexpected')
    expect(getFeedbackKindFromError('no es un error tipado')).toBe('unexpected')
  })
})
