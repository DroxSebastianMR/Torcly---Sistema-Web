import { describe, expect, it } from 'vitest'
import {
  operationsAttentionQuerySchema,
  operationsSectionParamSchema,
  operationsSummaryQuerySchema,
} from '../src/modules/operations/operations.schemas.js'

describe('Schemas de consulta operativa', () => {
  it('acepta fechas AAAA-MM-DD en el resumen', () => {
    const result = operationsSummaryQuerySchema.parse({
      from: '2026-10-01',
      to: '2026-10-31',
    })
    expect(result).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(operationsSummaryQuerySchema.parse({})).toEqual({
      from: undefined,
      to: undefined,
    })
  })

  it('rechaza fechas con formato inválido', () => {
    expect(() =>
      operationsSummaryQuerySchema.parse({ from: '01-10-2026' }),
    ).toThrow(/AAAA-MM-DD/)
    expect(() =>
      operationsAttentionQuerySchema.parse({ to: '2026/10/31' }),
    ).toThrow(/AAAA-MM-DD/)
  })

  it('coerce paginación con valores por defecto', () => {
    const result = operationsAttentionQuerySchema.parse({
      page: '3',
      pageSize: '25',
    })
    expect(result).toMatchObject({ page: 3, pageSize: 25 })
    expect(operationsAttentionQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
    })
    expect(() =>
      operationsAttentionQuerySchema.parse({ pageSize: '2' }),
    ).toThrow()
    expect(() => operationsAttentionQuerySchema.parse({ page: '0' })).toThrow()
  })

  it('solo admite secciones conocidas', () => {
    expect(operationsSectionParamSchema.parse({ section: 'sales' })).toEqual({
      section: 'sales',
    })
    expect(() =>
      operationsSectionParamSchema.parse({ section: 'otra' }),
    ).toThrow(/no es válida/)
  })
})
