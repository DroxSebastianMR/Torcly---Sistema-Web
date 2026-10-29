import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  loadInputs: vi.fn(),
  createRun: vi.fn(),
  listRuns: vi.fn(),
  loadRunDetail: vi.fn(),
}))

vi.mock('../src/modules/replenishment/replenishment.repository.js', () => ({
  replenishmentRepository: repository,
}))

import { replenishmentService } from '../src/modules/replenishment/replenishment.service.js'
import type {
  ReplenishmentEligibilityFilters,
  ReplenishmentInputs,
  ReplenishmentRunCreateInput,
  ReplenishmentRunDetailFilters,
} from '../src/modules/replenishment/replenishment.types.js'

const inputs: ReplenishmentInputs = {
  products: [
    {
      id: 'p1',
      code: 'P-001',
      name: 'Pastilla de freno',
      unitLabel: 'und',
      active: true,
      minimumStock: 5,
    },
    {
      id: 'p2',
      code: 'P-002',
      name: 'Aceite 5W30',
      unitLabel: 'L',
      active: true,
      minimumStock: 0,
    },
    {
      id: 'p3',
      code: 'P-003',
      name: 'Filtro viejo',
      unitLabel: 'und',
      active: false,
      minimumStock: 2,
    },
    {
      id: 'p4',
      code: 'P-004',
      name: 'Bujía',
      unitLabel: 'und',
      active: true,
      minimumStock: 1,
    },
  ],
  stock: [
    { productId: 'p1', stock: 10 },
    { productId: 'p2', stock: 30 },
    { productId: 'p3', stock: 0 },
    { productId: 'p4', stock: 0 },
  ],
  demand: [
    { productId: 'p1', quantity: 60, points: 5 },
    { productId: 'p2', quantity: 30, points: 3 },
    { productId: 'p4', quantity: 4, points: 1 },
  ],
}

function eligibilityFilters(
  overrides: Partial<ReplenishmentEligibilityFilters> = {},
): ReplenishmentEligibilityFilters {
  return {
    from: '2026-10-01',
    to: '2026-10-30',
    coverageDays: 30,
    search: null,
    priority: null,
    eligible: null,
    page: 1,
    pageSize: 20,
    ...overrides,
  }
}

const runSummary = {
  code: 'RAB-000007',
  strategyVersion: 'v1',
  period: { from: '2026-10-01', to: '2026-10-30' },
  periodDays: 30,
  coverageTargetDays: 30,
  actorName: 'Admin Demo',
  executedAt: '2026-10-30T12:00:00.000Z',
  eligibleCount: 2,
  suggestedTotal: 50,
  recommendationCount: 4,
}

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de reabastecimiento', () => {
  it('calcula elegibilidad ordenada, conteos y sin exponer UUIDs', async () => {
    repository.loadInputs.mockResolvedValue(inputs)

    const result =
      await replenishmentService.getEligibility(eligibilityFilters())

    expect(result.period).toEqual({ from: '2026-10-01', to: '2026-10-30' })
    expect(result.periodDays).toBe(30)
    expect(result.strategyVersion).toBe('v1')
    expect(result.minDemandPoints).toBe(3)
    expect(result.counts).toEqual({
      total: 4,
      eligible: 2,
      notEligible: 2,
      critical: 0,
      advisable: 1,
    })
    expect(result.items.map((item) => item.code)).toEqual([
      'P-001',
      'P-002',
      'P-004',
      'P-003',
    ])
    expect(result.items[0]).toMatchObject({
      code: 'P-001',
      eligible: true,
      suggestedQuantity: 50,
      priority: 'ALTA',
    })
    expect(result.items[1]).toMatchObject({ code: 'P-002', priority: 'BAJA' })
    expect(result.items[2]).toMatchObject({
      code: 'P-004',
      eligible: false,
      reason: 'INSUFFICIENT_DATA',
    })
    expect(result.items[3]).toMatchObject({
      code: 'P-003',
      eligible: false,
      reason: 'INACTIVE_PRODUCT',
    })
    expect(result.items[0]).not.toHaveProperty('productId')
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 4,
      totalPages: 1,
    })
    expect(repository.loadInputs).toHaveBeenCalledWith({
      from: '2026-10-01',
      to: '2026-10-30',
    })
  })

  it('filtra por búsqueda, prioridad y elegibilidad sobre el total', async () => {
    repository.loadInputs.mockResolvedValue(inputs)

    const searched = await replenishmentService.getEligibility(
      eligibilityFilters({ search: 'aceite' }),
    )
    expect(searched.items.map((item) => item.code)).toEqual(['P-002'])
    expect(searched.counts.total).toBe(4)

    const critical = await replenishmentService.getEligibility(
      eligibilityFilters({ priority: 'CRITICA' }),
    )
    expect(critical.items).toEqual([])
    expect(critical.pagination.total).toBe(0)

    const ineligible = await replenishmentService.getEligibility(
      eligibilityFilters({ eligible: false }),
    )
    expect(ineligible.items.map((item) => item.code)).toEqual([
      'P-004',
      'P-003',
    ])
  })

  it('pagina en memoria y exige al menos una página', async () => {
    repository.loadInputs.mockResolvedValue(inputs)

    const first = await replenishmentService.getEligibility(
      eligibilityFilters({ page: 1, pageSize: 2 }),
    )
    expect(first.items).toHaveLength(2)
    expect(first.pagination).toEqual({
      page: 1,
      pageSize: 2,
      total: 4,
      totalPages: 2,
    })

    const outside = await replenishmentService.getEligibility(
      eligibilityFilters({ page: 5, pageSize: 2 }),
    )
    expect(outside.items).toEqual([])
    expect(outside.pagination.totalPages).toBe(2)
  })

  it('rechaza rangos invertidos y coberturas fuera de rango', async () => {
    const inverted = await replenishmentService
      .getEligibility(
        eligibilityFilters({ from: '2026-10-10', to: '2026-10-01' }),
      )
      .catch((caught: unknown) => caught)
    expect(inverted).toMatchObject({
      status: 400,
      code: 'REPLENISHMENT_DATE_RANGE_INVALID',
    })

    const coverage = await replenishmentService
      .getEligibility(eligibilityFilters({ coverageDays: 0 }))
      .catch((caught: unknown) => caught)
    expect(coverage).toMatchObject({
      status: 400,
      code: 'REPLENISHMENT_COVERAGE_INVALID',
    })
    expect(repository.loadInputs).not.toHaveBeenCalled()
  })

  it('persiste la corrida con orden, conteos y total sugerido', async () => {
    repository.loadInputs.mockResolvedValue(inputs)
    repository.createRun.mockResolvedValue({ run: runSummary, replayed: false })

    const result = await replenishmentService.executeRun(
      {
        from: '2026-10-01',
        to: '2026-10-30',
        coverageDays: 30,
        idempotencyKey: 'corrida-abc-123',
      },
      { id: 'user-1', name: 'Admin Demo' },
      { requestId: 'req-1', ipAddress: '127.0.0.1' },
    )

    expect(result).toEqual({ run: runSummary, replayed: false })
    expect(repository.createRun).toHaveBeenCalledTimes(1)
    const [input, actor, context] = repository.createRun.mock.calls[0] as [
      ReplenishmentRunCreateInput,
      { id: string; name: string },
      unknown,
    ]
    expect(input).toMatchObject({
      strategyVersion: 'v1',
      period: { from: '2026-10-01', to: '2026-10-30' },
      coverageTargetDays: 30,
      idempotencyKey: 'corrida-abc-123',
      eligibleCount: 2,
      suggestedTotal: 50,
    })
    expect(input.recommendations.map((item) => item.productId)).toEqual([
      'p1',
      'p2',
      'p4',
      'p3',
    ])
    expect(input.recommendations.map((item) => item.sortOrder)).toEqual([
      0, 1, 2, 3,
    ])
    expect(actor).toEqual({ id: 'user-1', name: 'Admin Demo' })
    expect(context).toEqual({ requestId: 'req-1', ipAddress: '127.0.0.1' })
  })

  it('propaga el replay de una clave de idempotencia existente', async () => {
    repository.loadInputs.mockResolvedValue(inputs)
    repository.createRun.mockResolvedValue({ run: runSummary, replayed: true })

    const result = await replenishmentService.executeRun(
      {
        from: '2026-10-01',
        to: '2026-10-30',
        coverageDays: 30,
        idempotencyKey: 'corrida-abc-123',
      },
      { id: 'user-1', name: 'Admin Demo' },
      {},
    )

    expect(result.replayed).toBe(true)
  })

  it('pagina el historial y el detalle persistido', async () => {
    repository.listRuns.mockResolvedValue({ items: [runSummary], total: 3 })
    const history = await replenishmentService.listRuns({
      from: null,
      to: null,
      page: 2,
      pageSize: 1,
    })
    expect(history.items).toEqual([runSummary])
    expect(history.pagination).toEqual({
      page: 2,
      pageSize: 1,
      total: 3,
      totalPages: 3,
    })

    const detailFilters: ReplenishmentRunDetailFilters = {
      search: null,
      priority: null,
      eligible: null,
      page: 1,
      pageSize: 20,
    }
    repository.loadRunDetail.mockResolvedValue({
      run: runSummary,
      items: [
        {
          code: 'P-001',
          name: 'Pastilla de freno',
          unitLabel: 'und',
          eligible: true,
          reason: null,
          strategyVersion: 'v1',
          stockCurrent: 10,
          minimumStock: 5,
          demandQuantity: 60,
          demandPoints: 5,
          periodDays: 30,
          dailyDemand: 2,
          coverageTargetDays: 30,
          targetStock: 60,
          suggestedQuantity: 50,
          currentCoverageDays: 5,
          priority: 'ALTA',
          explanation: 'explicación',
        },
      ],
      total: 1,
    })
    const detail = await replenishmentService.getRunDetail(
      'RAB-000007',
      detailFilters,
    )
    expect(detail.run).toEqual(runSummary)
    expect(detail.items).toHaveLength(1)
    expect(detail.pagination.totalPages).toBe(1)
    expect(repository.loadRunDetail).toHaveBeenCalledWith(
      'RAB-000007',
      detailFilters,
    )
  })
})
