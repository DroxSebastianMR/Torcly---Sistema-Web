// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reportModuleLoad } from './module-load-metrics'

describe('reportModuleLoad', () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true })

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('envía la medición únicamente a la API del proyecto', () => {
    reportModuleLoad('/reports', 1234.5678, 'route-change')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/metrics/module-load')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
  })

  it('reporta solo los campos permitidos y redondea la duración', () => {
    reportModuleLoad('/dashboard', 987.654321, 'initial')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body))
    expect(Object.keys(body).sort()).toEqual([
      'durationMs',
      'navigationType',
      'path',
    ])
    expect(body.durationMs).toBe(987.65)
    expect(body.navigationType).toBe('initial')
    expect(body.path).toBe('/dashboard')
  })

  it('no bloquea la navegación aunque el envío falle', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))

    expect(() => reportModuleLoad('/sales', 100, 'route-change')).not.toThrow()

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })
})
