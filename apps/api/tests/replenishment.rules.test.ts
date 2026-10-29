import { describe, expect, it } from 'vitest'
import {
  assertCoverageTargetDays,
  compareReplenishmentRecommendations,
  computeReplenishmentRecommendation,
  daysBetween,
  resolveReplenishmentPeriod,
  roundCoverage,
  roundDailyDemand,
  roundQuantity,
} from '../src/modules/replenishment/replenishment.rules.js'

function recommendation(
  overrides: Partial<
    Parameters<typeof computeReplenishmentRecommendation>[0]
  > = {},
) {
  return computeReplenishmentRecommendation({
    code: 'P-001',
    name: 'Pastilla de freno',
    unitLabel: 'und',
    active: true,
    stockCurrent: 10,
    minimumStock: 5,
    demandQuantity: 60,
    demandPoints: 5,
    periodDays: 30,
    coverageTargetDays: 30,
    ...overrides,
  })
}

describe('Reglas de reabastecimiento', () => {
  it('resuelve el período predefinido a 30 días y valida el rango', () => {
    const period = resolveReplenishmentPeriod('2026-10-01', '2026-10-31')
    expect(period).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(31)

    const current = resolveReplenishmentPeriod(null, '2026-10-10')
    expect(current.to).toBe('2026-10-10')
    expect(current.from).toBe('2026-09-10')

    expect(() =>
      resolveReplenishmentPeriod('2026-10-05', '2026-10-01'),
    ).toThrow(
      expect.objectContaining({
        status: 400,
        code: 'REPLENISHMENT_DATE_RANGE_INVALID',
      }),
    )
  })

  it('acepta coberturas de 1 a 365 días y rechaza las demás', () => {
    expect(assertCoverageTargetDays(1)).toBe(1)
    expect(assertCoverageTargetDays(30)).toBe(30)
    expect(assertCoverageTargetDays(365)).toBe(365)

    for (const value of [0, 366, 1.5, -5]) {
      expect(() => assertCoverageTargetDays(value)).toThrow(
        expect.objectContaining({
          status: 400,
          code: 'REPLENISHMENT_COVERAGE_INVALID',
        }),
      )
    }
  })

  it('documenta los redondeos de demanda, cantidad y cobertura', () => {
    expect(roundDailyDemand(10 / 3)).toBe(3.333333)
    expect(roundQuantity(60.00049)).toBe(60)
    expect(roundCoverage(7.25)).toBe(7.3)
    expect(roundCoverage(7.24)).toBe(7.2)
  })

  it('calcula demanda diaria, stock objetivo y cantidad sugerida con techo', () => {
    const result = recommendation()

    expect(result.dailyDemand).toBe(2)
    expect(result.targetStock).toBe(60)
    expect(result.suggestedQuantity).toBe(50)
    expect(result.currentCoverageDays).toBe(5)
    expect(result.eligible).toBe(true)
    expect(result.reason).toBeNull()

    const fractional = recommendation({
      demandQuantity: 10,
      demandPoints: 4,
      periodDays: 3,
      stockCurrent: 0,
      minimumStock: 0,
    })
    expect(fractional.dailyDemand).toBe(3.333333)
    expect(fractional.targetStock).toBe(100)
    expect(fractional.suggestedQuantity).toBe(100)

    const halves = recommendation({
      demandQuantity: 30,
      demandPoints: 3,
      stockCurrent: 0.5,
      minimumStock: 0,
      coverageTargetDays: 20,
    })
    expect(halves.targetStock).toBe(20)
    expect(halves.suggestedQuantity).toBe(20)
  })

  it('nunca sugiere cantidades negativas cuando el stock alcanza', () => {
    const covered = recommendation({ stockCurrent: 60 })
    expect(covered.suggestedQuantity).toBe(0)
    expect(covered.currentCoverageDays).toBe(30)
    expect(covered.priority).toBe('BAJA')

    const above = recommendation({ stockCurrent: 120 })
    expect(above.suggestedQuantity).toBe(0)
    expect(above.currentCoverageDays).toBe(60)
    expect(above.priority).toBe('BAJA')
  })

  it('asigna prioridad por mínimo, cobertura y sugerencia', () => {
    expect(recommendation({ stockCurrent: 4, minimumStock: 5 }).priority).toBe(
      'CRITICA',
    )
    expect(recommendation().priority).toBe('ALTA')
    expect(
      recommendation({
        stockCurrent: 20,
        demandQuantity: 30,
        demandPoints: 3,
        minimumStock: 0,
      }).priority,
    ).toBe('MEDIA')
    expect(
      recommendation({
        stockCurrent: 60,
        demandPoints: 3,
        minimumStock: 0,
      }).priority,
    ).toBe('BAJA')
  })

  it('explica cada cálculo con sus insumos y prioridad', () => {
    const explanation = recommendation().explanation
    expect(explanation).toContain('5 registro(s) de demanda confirmada')
    expect(explanation).toContain('Demanda diaria = demanda ÷ días = 2')
    expect(explanation).toContain('Stock objetivo = demanda diaria × cobertura')
    expect(explanation).toContain(
      'Cantidad sugerida = techo(60 − stock actual 10) = 50',
    )
    expect(explanation).toContain('Prioridad Alta')
  })

  it('marca productos inactivos sin cantidad sugerida', () => {
    const result = recommendation({ active: false })
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('INACTIVE_PRODUCT')
    expect(result.suggestedQuantity).toBeNull()
    expect(result.dailyDemand).toBeNull()
    expect(result.priority).toBeNull()
    expect(result.explanation).toContain('Producto inactivo')
  })

  it('declara datos insuficientes en lugar de un cero engañoso', () => {
    const fewPoints = recommendation({
      demandQuantity: 4,
      demandPoints: 2,
      stockCurrent: 0,
      minimumStock: 0,
    })
    expect(fewPoints.eligible).toBe(false)
    expect(fewPoints.reason).toBe('INSUFFICIENT_DATA')
    expect(fewPoints.suggestedQuantity).toBeNull()
    expect(fewPoints.explanation).toContain('2 registro(s)')
    expect(fewPoints.explanation).toContain('al menos 3')

    const noDemand = recommendation({ demandQuantity: 0, demandPoints: 0 })
    expect(noDemand.eligible).toBe(false)
    expect(noDemand.reason).toBe('INSUFFICIENT_DATA')
    expect(noDemand.explanation).toContain('Sin demanda confirmada')
  })

  it('ordena por elegibilidad, prioridad, sugerido y nombre', () => {
    const items = [
      {
        eligible: true,
        priority: 'BAJA',
        suggestedQuantity: 0,
        name: 'Bujía',
      },
      {
        eligible: false,
        priority: null,
        suggestedQuantity: null,
        name: 'Anillo',
      },
      {
        eligible: true,
        priority: 'ALTA',
        suggestedQuantity: 10,
        name: 'Filtro',
      },
      {
        eligible: true,
        priority: 'ALTA',
        suggestedQuantity: 30,
        name: 'Pastilla',
      },
      {
        eligible: true,
        priority: 'CRITICA',
        suggestedQuantity: 1,
        name: 'Junta',
      },
    ]

    const sorted = [...items].sort(compareReplenishmentRecommendations)
    expect(sorted.map((item) => item.name)).toEqual([
      'Junta',
      'Pastilla',
      'Filtro',
      'Bujía',
      'Anillo',
    ])
  })
})
