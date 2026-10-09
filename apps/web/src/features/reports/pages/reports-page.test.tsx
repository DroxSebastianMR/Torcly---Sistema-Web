// @vitest-environment jsdom

import { AxiosError } from 'axios'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SalesBlockData } from '../types/reports.types'
import Page from './reports-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const reports = vi.hoisted(() => ({
  useReportSummary: vi.fn(),
  useReportBlock: vi.fn(),
}))
vi.mock('../hooks/use-reports', () => ({
  reportKeys: {
    summary: () => ['reports', 'summary'],
    block: () => ['reports', 'block'],
  },
  useReportSummary: reports.useReportSummary,
  useReportBlock: reports.useReportBlock,
}))

const salesBlock: SalesBlockData = {
  block: 'sales',
  descriptor: {
    block: 'sales',
    label: 'Ventas',
    source: 'Órdenes de venta confirmadas',
    periodField: 'Confirmación',
    criteria: 'Ventas con estado confirmado en el período.',
    trendMeasure: 'Ventas e importe',
    permissions: ['sales:read'],
  },
  period: { from: '2026-10-01', to: '2026-10-31' },
  granularity: 'day',
  metrics: { count: 3, amount: 340, averageTicket: 113.33 },
  trend: [{ bucket: '2026-10-01', label: '1 oct', count: 1, amount: 340 }],
  composition: [],
}

function httpError(status: number): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      data: undefined,
      status,
      statusText: '',
      headers: {},
      config: { headers: undefined as never } as never,
    },
  )
}

function summaryOk() {
  return {
    data: {
      generatedAt: '2026-10-07T00:00:00.000Z',
      period: { from: '2026-10-01', to: '2026-10-31' },
      blocks: { sales: salesBlock.descriptor },
    },
    isPending: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }
}

function blockResult(
  overrides: {
    data?: unknown
    isPending?: boolean
    isError?: boolean
    error?: unknown
  } = {},
) {
  const {
    data = salesBlock,
    isPending = false,
    isError = false,
    error,
  } = overrides
  return {
    data,
    isPending,
    isFetching: isPending,
    isError,
    error,
    refetch: vi.fn(),
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  )
}

describe('Página de reportes', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra reportes e indicadores para el bloque autorizado', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read', 'sales:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())
    reports.useReportBlock.mockReturnValue(blockResult())

    renderPage()

    expect(screen.getByRole('heading', { name: 'Reportes' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Ventas' })).toBeTruthy()
    expect(screen.getAllByText('Importe').length).toBeGreaterThan(0)
    expect(screen.getByText('Ticket promedio')).toBeTruthy()
  })

  it('omite los bloques de módulos sin permiso', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read', 'sales:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())
    reports.useReportBlock.mockReturnValue(blockResult())

    renderPage()

    expect(screen.getByRole('heading', { name: 'Ventas' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Cobros' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Inventario' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Servicios' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Taller' })).toBeNull()
  })

  it('muestra estado restringido cuando el bloque responde 403', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read', 'sales:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())
    reports.useReportBlock.mockReturnValue(
      blockResult({ data: undefined, isError: true, error: httpError(403) }),
    )

    renderPage()

    expect(screen.getByText('Sección restringida')).toBeTruthy()
  })

  it('muestra estado de carga por bloque', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read', 'sales:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())
    reports.useReportBlock.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('status', { name: 'Cargando Ventas' })).toBeTruthy()
  })

  it('muestra estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read', 'sales:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())
    reports.useReportBlock.mockReturnValue(
      blockResult({ data: undefined, isError: true, error: new Error('red') }),
    )

    renderPage()

    expect(screen.getByText('No se pudo cargar Ventas.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('muestra estado vacío sin bloques autorizados', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())

    renderPage()

    expect(screen.getByText('Sin reportes disponibles')).toBeTruthy()
  })

  it('aplica el período por defecto y lo muestra', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['reports:read', 'sales:read'] },
    })
    reports.useReportSummary.mockReturnValue(summaryOk())
    reports.useReportBlock.mockReturnValue(blockResult())

    renderPage()

    expect(screen.getByRole('button', { name: 'Últimos 30 días' })).toBeTruthy()
    expect(screen.getByText(/Período aplicado:/)).toBeTruthy()
    expect(reports.useReportBlock).toHaveBeenCalledWith(
      'sales',
      expect.objectContaining({
        from: expect.any(String),
        to: expect.any(String),
      }),
    )
  })
})
