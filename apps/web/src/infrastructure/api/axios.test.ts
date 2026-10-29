import { AxiosError, type AxiosAdapter } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http } from './axios'
import { onSessionExpired } from './session-events'

const originalAdapter = http.defaults.adapter

function rejectWithStatus(status: number): AxiosAdapter {
  return (config) =>
    Promise.reject(
      new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, {
        data: undefined,
        status,
        statusText: '',
        headers: {},
        config,
      }),
    )
}

afterEach(() => {
  http.defaults.adapter = originalAdapter
})

describe('Interceptor de sesión', () => {
  it('notifica sesión vencida ante un 401 de un endpoint de negocio', async () => {
    http.defaults.adapter = rejectWithStatus(401)
    const listener = vi.fn()
    const off = onSessionExpired(listener)

    await expect(http.get('/products')).rejects.toBeInstanceOf(AxiosError)
    expect(listener).toHaveBeenCalledOnce()

    off()
  })

  it('no notifica sesión vencida al sondear la sesión actual', async () => {
    http.defaults.adapter = rejectWithStatus(401)
    const listener = vi.fn()
    const off = onSessionExpired(listener)

    await expect(http.get('/auth/me')).rejects.toBeInstanceOf(AxiosError)
    expect(listener).not.toHaveBeenCalled()

    off()
  })

  it('no notifica ante errores distintos a 401', async () => {
    http.defaults.adapter = rejectWithStatus(403)
    const listener = vi.fn()
    const off = onSessionExpired(listener)

    await expect(http.get('/products')).rejects.toBeInstanceOf(AxiosError)
    expect(listener).not.toHaveBeenCalled()

    off()
  })
})
