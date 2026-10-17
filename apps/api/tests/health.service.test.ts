import { describe, expect, it } from 'vitest'
import { buildReadiness } from '../src/modules/health/health.service.js'

describe('Readiness del API', () => {
  it('reporta ok cuando la dependencia responde', () => {
    const result = buildReadiness('ok')

    expect(result).toMatchObject({
      status: 'ok',
      service: 'torcly-api',
      checks: { database: 'ok' },
    })
    expect(typeof result.timestamp).toBe('string')
  })

  it('reporta degradado cuando la dependencia falla', () => {
    const result = buildReadiness('unavailable')

    expect(result).toMatchObject({
      status: 'degraded',
      service: 'torcly-api',
      checks: { database: 'unavailable' },
    })
  })

  it('no expone detalles internos ni cadenas de conexión', () => {
    const result = buildReadiness('unavailable')

    expect(JSON.stringify(result)).not.toMatch(/postgres(ql)?:\/\//i)
    expect(JSON.stringify(result)).not.toContain('ECONNREFUSED')
    expect(JSON.stringify(result)).not.toContain('5432')
  })
})
