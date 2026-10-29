import { describe, expect, it } from 'vitest'
import {
  replenishmentEligibilityQuerySchema,
  replenishmentRunBodySchema,
  replenishmentRunDetailQuerySchema,
  replenishmentRunListQuerySchema,
  replenishmentRunParamSchema,
} from '../src/modules/replenishment/replenishment.schemas.js'

describe('Esquemas de reabastecimiento', () => {
  it('aplica los valores por defecto de paginación y cobertura', () => {
    const parsed = replenishmentEligibilityQuerySchema.parse({})
    expect(parsed.coverageDays).toBe(30)
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(20)
    expect(parsed.search).toBeNull()
    expect(parsed.priority).toBeNull()
    expect(parsed.eligible).toBeNull()
  })

  it('normaliza filtros de elegibilidad, prioridad y búsqueda', () => {
    const parsed = replenishmentEligibilityQuerySchema.parse({
      from: '2026-10-01',
      to: '2026-10-31',
      coverageDays: '15',
      eligible: 'true',
      priority: 'ALTA',
      search: '  pastilla  ',
    })
    expect(parsed).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-31',
      coverageDays: 15,
      eligible: true,
      priority: 'ALTA',
      search: 'pastilla',
    })

    expect(
      replenishmentEligibilityQuerySchema.parse({ eligible: 'false' }).eligible,
    ).toBe(false)
  })

  it('rechaza fechas, coberturas y prioridades inválidas', () => {
    for (const value of ['2026/10/01', '01-10-2026', '20261001']) {
      expect(
        replenishmentEligibilityQuerySchema.safeParse({ from: value }).success,
      ).toBe(false)
    }
    expect(
      replenishmentEligibilityQuerySchema.safeParse({ coverageDays: 0 })
        .success,
    ).toBe(false)
    expect(
      replenishmentEligibilityQuerySchema.safeParse({ coverageDays: 366 })
        .success,
    ).toBe(false)
    expect(
      replenishmentEligibilityQuerySchema.safeParse({ eligible: 'si' }).success,
    ).toBe(false)
    expect(
      replenishmentEligibilityQuerySchema.safeParse({ priority: 'URGENTE' })
        .success,
    ).toBe(false)
  })

  it('valida el cuerpo de la corrida y la clave de idempotencia', () => {
    expect(replenishmentRunBodySchema.parse({})).toMatchObject({
      coverageDays: 30,
      idempotencyKey: null,
    })
    expect(
      replenishmentRunBodySchema.parse({
        from: '2026-10-01',
        to: '2026-10-31',
        coverageDays: '7',
        idempotencyKey: '  corrida-abcd-1234  ',
      }),
    ).toMatchObject({
      coverageDays: 7,
      idempotencyKey: 'corrida-abcd-1234',
    })

    expect(
      replenishmentRunBodySchema.safeParse({ idempotencyKey: 'corta' }).success,
    ).toBe(false)
    expect(
      replenishmentRunBodySchema.safeParse({ coverageDays: 400 }).success,
    ).toBe(false)
    expect(
      replenishmentRunBodySchema.safeParse({ desconocido: true }).success,
    ).toBe(false)
  })

  it('valida el código de corrida por parámetro de ruta', () => {
    expect(replenishmentRunParamSchema.parse({ code: 'RAB-000123' }).code).toBe(
      'RAB-000123',
    )
    for (const value of [
      'RAB-123',
      'rab-000123',
      'VENTA-000001',
      'RAB-0001234',
    ]) {
      expect(
        replenishmentRunParamSchema.safeParse({ code: value }).success,
      ).toBe(false)
    }
  })

  it('acepta el listado de historial y el detalle con filtros', () => {
    expect(replenishmentRunListQuerySchema.parse({}).pageSize).toBe(20)
    expect(
      replenishmentRunListQuerySchema.parse({ page: '2', pageSize: '50' }),
    ).toMatchObject({ page: 2, pageSize: 50 })

    expect(
      replenishmentRunDetailQuerySchema.parse({ priority: 'CRITICA' }).priority,
    ).toBe('CRITICA')
    expect(
      replenishmentRunDetailQuerySchema.parse({ eligible: 'false' }).eligible,
    ).toBe(false)
  })
})
