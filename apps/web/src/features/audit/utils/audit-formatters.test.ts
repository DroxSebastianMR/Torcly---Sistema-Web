import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { formatAuditEvent, getAuditErrorMessage } from './audit-formatters'

function httpError(status: number, message?: string): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      data: message ? { error: { message } } : undefined,
      status,
      statusText: '',
      headers: {},
      config: { headers: undefined as never } as never,
    },
  )
}

describe('formatAuditEvent', () => {
  it('traduce los eventos conocidos', () => {
    expect(formatAuditEvent('LOGIN_SUCCESS')).toBe('Inicio de sesión correcto')
    expect(formatAuditEvent('ACCESS_DENIED')).toBe('Acceso denegado')
  })

  it('deja intactos los eventos desconocidos', () => {
    expect(formatAuditEvent('CUSTOM_EVENT')).toBe('CUSTOM_EVENT')
  })
})

describe('getAuditErrorMessage', () => {
  it('prefiere el mensaje de la API', () => {
    expect(getAuditErrorMessage(httpError(403, 'No tienes permiso.'))).toBe(
      'No tienes permiso.',
    )
  })

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(getAuditErrorMessage(new Error('boom'))).toBe(
      'No se pudo completar la operación.',
    )
  })
})
