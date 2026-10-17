// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReplenishmentRunDetail } from '../types/replenishment.types'
import { RunDetailModal } from './run-detail-modal'

const replenishment = vi.hoisted(() => ({ useRunDetail: vi.fn() }))

vi.mock('../hooks/use-replenishment', () => ({
  useRunDetail: replenishment.useRunDetail,
}))

const detail: ReplenishmentRunDetail = {
  run: {
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
  items: [
    {
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
      explanation: 'Prioridad Crítica: el stock actual no supera el mínimo.',
    },
    {
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
      periodDays: 31,
      dailyDemand: null,
      coverageTargetDays: 30,
      targetStock: null,
      suggestedQuantity: null,
      currentCoverageDays: null,
      priority: null,
      explanation: 'Datos insuficientes en el período.',
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
}

function detailQuery(overrides: { isError?: boolean } = {}) {
  const { isError = false } = overrides
  return {
    data: isError ? undefined : detail,
    isPending: false,
    isFetching: false,
    isError,
    refetch: vi.fn(),
  }
}

function renderModal(code: string | null) {
  return render(<RunDetailModal code={code} onClose={vi.fn()} />)
}

describe('Modal de detalle de corrida de reabastecimiento', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el resumen de la corrida con sus recomendaciones', () => {
    replenishment.useRunDetail.mockReturnValue(detailQuery())

    renderModal('RAB-000001')

    expect(
      screen.getByRole('heading', { name: 'Corrida RAB-000001' }),
    ).toBeTruthy()
    expect(screen.getByText('Filtro de aceite')).toBeTruthy()
    expect(screen.getByText('RPLA-001')).toBeTruthy()
    expect(screen.getByText('Elegible')).toBeTruthy()
    expect(screen.getByText('Crítica')).toBeTruthy()
    expect(screen.getByText('Balata')).toBeTruthy()
    expect(screen.getByText('Datos insuficientes')).toBeTruthy()
    expect(screen.getByText('Sugerido total')).toBeTruthy()
    expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(2)
  })

  it('expande la explicación de la recomendación', async () => {
    replenishment.useRunDetail.mockReturnValue(detailQuery())

    renderModal('RAB-000001')

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Ver explicación de Filtro de aceite',
      }),
    )

    expect(
      screen.getByText(
        'Prioridad Crítica: el stock actual no supera el mínimo.',
      ),
    ).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    replenishment.useRunDetail.mockReturnValue(detailQuery({ isError: true }))

    renderModal('RAB-000001')

    expect(
      screen.getByText('No se pudo cargar el detalle de la corrida'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('no consulta la API sin código de corrida', () => {
    replenishment.useRunDetail.mockReturnValue(detailQuery())

    renderModal(null)

    expect(replenishment.useRunDetail).toHaveBeenCalledTimes(1)
    expect(replenishment.useRunDetail.mock.calls[0]?.[0]).toBeNull()
  })
})
