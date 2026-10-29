import { describe, expect, it } from 'vitest'
import { auditQuerySchema } from '../src/modules/audit/audit.schemas.js'

describe('Esquema de consulta de auditoría', () => {
  it('aplica paginación por defecto', () => {
    const parsed = auditQuerySchema.parse({})
    expect(parsed).toMatchObject({ page: 1, pageSize: 25 })
  })

  it('convierte valores de paginación y rechaza tamaños excesivos', () => {
    expect(auditQuerySchema.parse({ page: '2', pageSize: '50' })).toMatchObject(
      {
        page: 2,
        pageSize: 50,
      },
    )
    expect(() => auditQuerySchema.parse({ pageSize: '500' })).toThrow()
    expect(() => auditQuerySchema.parse({ page: '0' })).toThrow()
  })

  it('rechaza eventos desconocidos', () => {
    expect(() => auditQuerySchema.parse({ event: 'NOT_REAL' })).toThrow()
  })

  it('acepta filtros válidos y convierte fechas', () => {
    const parsed = auditQuerySchema.parse({
      event: 'LOGIN_FAILURE',
      from: '2026-10-01',
      to: '2026-10-31',
      identifier: 'admin',
      actorId: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
    })

    expect(parsed.event).toBe('LOGIN_FAILURE')
    expect(parsed.from).toBeInstanceOf(Date)
    expect(parsed.to).toBeInstanceOf(Date)
    expect(parsed.identifier).toBe('admin')
    expect(parsed.actorId).toBe('70c3d238-3fd5-42c7-9a3e-d1eea534899e')
  })
})
