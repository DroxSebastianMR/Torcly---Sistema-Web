import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { normalizeRoutePath } from '../src/shared/observability/normalize-route.js'
import { requestTiming } from '../src/middlewares/request-timing.js'

const UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

describe('normalizeRoutePath', () => {
  it('reemplaza UUIDs por un placeholder estable', () => {
    expect(normalizeRoutePath(`/api/v1/customers/${UUID}`)).toBe(
      '/api/v1/customers/:uuid',
    )
  })

  it('reemplaza segmentos numéricos por :id', () => {
    expect(normalizeRoutePath('/api/v1/sales/42/lines/7')).toBe(
      '/api/v1/sales/:id/lines/:id',
    )
  })

  it('conserva rutas sin parámetros dinámicos', () => {
    expect(normalizeRoutePath('/api/v1/reports/sales')).toBe(
      '/api/v1/reports/sales',
    )
  })
})

describe('requestTiming middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV
  let infoSpy: ReturnType<typeof vi.spyOn>

  function createMocks(options: {
    path: string
    originalUrl?: string
    method?: string
    baseUrl?: string
    routePath?: string
  }) {
    const request = {
      path: options.path,
      originalUrl: options.originalUrl ?? options.path,
      method: options.method ?? 'GET',
      baseUrl: options.baseUrl ?? '',
      route: options.routePath ? { path: options.routePath } : undefined,
    } as unknown as Request
    const listeners = new Map<string, () => void>()
    const response = {
      locals: { requestId: 'req-123' },
      statusCode: 200,
      once: (event: string, handler: () => void) => {
        listeners.set(event, handler)
      },
    } as unknown as Response
    const finish = () => listeners.get('finish')?.()
    return { request, response, finish }
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    infoSpy.mockRestore()
  })

  it('emite solo campos técnicos permitidos en el log', () => {
    const { request, response, finish } = createMocks({
      path: `/api/v1/customers/${UUID}`,
    })
    let nextCalled = false
    requestTiming(request, response, () => {
      nextCalled = true
    })
    expect(nextCalled).toBe(true)
    finish()

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string)
    expect(Object.keys(payload).sort()).toEqual([
      'durationMs',
      'event',
      'level',
      'method',
      'module',
      'operation',
      'requestId',
      'route',
      'status',
    ])
  })

  it('registra la ruta normalizada y nunca el identificador original', () => {
    const { request, response, finish } = createMocks({
      path: `/api/v1/customers/${UUID}`,
      method: 'PATCH',
    })
    requestTiming(request, response, () => undefined)
    finish()

    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string)
    expect(payload.route).toBe('/api/v1/customers/:uuid')
    expect(payload.route).not.toContain(UUID)
    expect(payload.module).toBe('customers')
    expect(payload.operation).toBe('update')
    expect(payload.status).toBe(200)
    expect(typeof payload.durationMs).toBe('number')
  })

  it('usa la ruta del router cuando está disponible', () => {
    const { request, response, finish } = createMocks({
      path: '/api/v1/sales/42',
      baseUrl: '/api/v1/sales',
      routePath: '/:id',
    })
    requestTiming(request, response, () => undefined)
    finish()

    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string)
    expect(payload.route).toBe('/api/v1/sales/:id')
  })

  it('conserva el módulo al finalizar una ruta montada', () => {
    const { request, response, finish } = createMocks({
      path: '/me',
      originalUrl: '/api/v1/auth/me',
    })
    requestTiming(request, response, () => undefined)
    finish()

    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string)
    expect(payload.route).toBe('/api/v1/auth/me')
    expect(payload.module).toBe('auth')
  })

  it('no registra contraseñas, cookies ni cabeceras', () => {
    const { request, response, finish } = createMocks({
      path: '/api/v1/auth/login',
      method: 'POST',
    })
    requestTiming(request, response, () => undefined)
    finish()

    const raw = infoSpy.mock.calls[0][0] as string
    expect(raw).not.toMatch(/password|cookie|authorization|token/i)
  })
})
