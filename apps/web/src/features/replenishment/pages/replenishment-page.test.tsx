// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  ReplenishmentEligibility,
  ReplenishmentRecommendation,
  ReplenishmentRunList,
} from '../types/replenishment.types'
import Page from './replenishment-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const replenishment = vi.hoisted(() => ({
  useEligibility: vi.fn(),
  useReplenishmentRuns: vi.fn(),
}))
vi.mock('../hooks/use-replenishment', () => ({
  replenishmentKeys: {
    all: ['replenishment'],
    eligibility: () => ['replenishment', 'eligibility'],
    runs: () => ['replenishment', 'runs'],
    runDetail: () => ['replenishment', 'run-detail'],
  },
  useEligibility: replenishment.useEligibility,
  useReplenishmentRuns: replenishment.useReplenishmentRuns,
}))

vi.mock('../components/run-modal', () => ({ RunModal: () => null }))
vi.mock('../components/run-detail-modal', () => ({
  RunDetailModal: () => null,
}))

const eligibleRecommendation: ReplenishmentRecommendation = {
  code: 'RPLA-001',
  name: 'Filtro de aceite',
  unitLabel: 'und',
  eligible: true,
  reason: null,
  strategyVersion: 'v1',
  stockCurrent: 10,
  minimumStock: 20,
  demandQuantity: 30,
  demandPoints: 5,
  periodDays: 30,
  dailyDemand: 1,
  coverageTargetDays: 30,
  targetStock: 30,
  suggestedQuantity: 20,
  currentCoverageDays: 10,
  priority: 'CRITICA',
  explanation: '5 registro(s) de demanda confirmada suman 30 en 30 días.',
}

const notEligibleRecommendation: ReplenishmentRecommendation = {
  code: 'RPLB-001',
  name: 'Balata',
  unitLabel: 'und',
  eligible: false,
  reason: 'INSUFFICIENT_DATA',
  strategyVersion: 'v1',
  stockCurrent: 0,
  minimumStock: 10,
  demandQuantity: 0,
  demandPoints: 1,
  periodDays: 30,
  dailyDemand: null,
  coverageTargetDays: 30,
  targetStock: null,
  suggestedQuantity: null,
  currentCoverageDays: null,
  priority: null,
  explanation: 'Solo 1 registro(s) de demanda confirmada en el período.',
}

function eligibilityResponse(
  overrides: Partial<ReplenishmentEligibility> = {},
): ReplenishmentEligibility {
  return {
    period: { from: '2026-10-01', to: '2026-10-31' },
    periodDays: 31,
    coverageTargetDays: 30,
    strategyVersion: 'v1',
    minDemandPoints: 3,
    counts: {
      total: 2,
      eligible: 1,
      notEligible: 1,
      critical: 1,
      advisable: 0,
    },
    items: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function runsResponse(overrides: Partial<ReplenishmentRunList> = {}) {
  return {
    items: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function eligibilityQuery(
  overrides: {
    data?: ReplenishmentEligibility
    isPending?: boolean
    isError?: boolean
  } = {},
) {
  const {
    data = eligibilityResponse(),
    isPending = false,
    isError = false,
  } = overrides
  return { data, isPending, isFetching: isPending, isError, refetch: vi.fn() }
}

function runsQuery(
  overrides: {
    data?: ReplenishmentRunList
    isPending?: boolean
    isError?: boolean
  } = {},
) {
  const {
    data = runsResponse(),
    isPending = false,
    isError = false,
  } = overrides
  return { data, isPending, isFetching: isPending, isError, refetch: vi.fn() }
}

function renderPage() {
  return render(<Page />)
}

describe('Página de reabastecimiento', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y oculta la ejecución sin permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['inventory:read'] },
    })
    replenishment.useEligibility.mockReturnValue(eligibilityQuery())
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Reabastecimiento' }),
    ).toBeTruthy()
    expect(screen.getByText('Productos analizados')).toBeTruthy()
    expect(screen.getByText('Sin resultados por los filtros')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Ejecutar corrida' }),
    ).toBeNull()
  })

  it('muestra el botón de ejecución con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['inventory:read', 'inventory:write'] },
    })
    replenishment.useEligibility.mockReturnValue(eligibilityQuery())
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Ejecutar corrida' }),
    ).toBeTruthy()
  })

  it('lista recomendaciones elegibles y no elegibles con sus prioridades', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['inventory:read', 'inventory:write'] },
    })
    replenishment.useEligibility.mockReturnValue(
      eligibilityQuery({
        data: eligibilityResponse({
          counts: {
            total: 2,
            eligible: 1,
            notEligible: 1,
            critical: 1,
            advisable: 0,
          },
          items: [eligibleRecommendation, notEligibleRecommendation],
          pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
        }),
      }),
    )
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    expect(screen.getAllByText('Filtro de aceite').length).toBeGreaterThan(0)
    expect(screen.getAllByText('RPLA-001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Elegible').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Crítica').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Balata').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Datos insuficientes').length).toBeGreaterThan(0)
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    replenishment.useEligibility.mockReturnValue(
      eligibilityQuery({ data: undefined, isPending: true }),
    )
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    expect(screen.getByLabelText('Cargando recomendaciones')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    replenishment.useEligibility.mockReturnValue(
      eligibilityQuery({ data: undefined, isError: true }),
    )
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    expect(
      screen.getByText('No se pudieron cargar las recomendaciones'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    replenishment.useEligibility.mockReturnValue(eligibilityQuery())
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Buscar recomendaciones' }),
    )
    await userEvent.type(
      await screen.findByPlaceholderText('Escribe un código o nombre…'),
      'filtro',
    )

    await waitFor(() =>
      expect(replenishment.useEligibility).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'filtro' }),
        true,
      ),
    )
  })

  it('cambia a la pestaña de historial y muestra las corridas', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    replenishment.useEligibility.mockReturnValue(eligibilityQuery())
    replenishment.useReplenishmentRuns.mockReturnValue(
      runsQuery({
        data: runsResponse({
          items: [
            {
              code: 'RAB-000001',
              strategyVersion: 'v1',
              period: { from: '2026-10-01', to: '2026-10-31' },
              periodDays: 31,
              coverageTargetDays: 30,
              actorName: 'Arian',
              executedAt: '2026-10-07T12:00:00.000Z',
              eligibleCount: 1,
              suggestedTotal: 20,
              recommendationCount: 2,
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        }),
      }),
    )

    renderPage()

    await userEvent.click(screen.getByRole('tab', { name: 'Historial' }))

    expect(screen.getAllByText('RAB-000001').length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', {
        name: 'Ver detalle de corrida RAB-000001',
      }).length,
    ).toBeGreaterThan(0)
  })

  it('muestra el estado vacío del historial sin corridas', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    replenishment.useEligibility.mockReturnValue(eligibilityQuery())
    replenishment.useReplenishmentRuns.mockReturnValue(runsQuery())

    renderPage()

    await userEvent.click(screen.getByRole('tab', { name: 'Historial' }))

    expect(screen.getByText('Sin corridas registradas')).toBeTruthy()
  })
})
