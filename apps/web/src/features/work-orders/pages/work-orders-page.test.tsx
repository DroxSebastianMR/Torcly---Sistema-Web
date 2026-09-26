// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WorkOrdersResponse } from '../types/work-orders.types'
import Page from './work-orders-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const orders = vi.hoisted(() => ({
  useWorkOrders: vi.fn(),
  useWorkOrder: vi.fn(),
}))
vi.mock('../hooks/use-work-orders', () => ({
  workOrderKeys: { all: ['work-orders'] },
  useWorkOrders: orders.useWorkOrders,
  useWorkOrder: orders.useWorkOrder,
}))

const reactQuery = vi.hoisted(() => ({ useQuery: vi.fn() }))
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...original,
    useQuery: reactQuery.useQuery,
  }
})

vi.mock('../components/work-order-detail-modal', () => ({
  WorkOrderDetailModal: () => null,
}))
vi.mock('../components/work-order-diagnosis-modal', () => ({
  WorkOrderDiagnosisModal: () => null,
}))
vi.mock('../components/work-order-budget-modal', () => ({
  WorkOrderBudgetModal: () => null,
}))
vi.mock('../components/work-order-decision-modal', () => ({
  WorkOrderDecisionModal: () => null,
}))
vi.mock('../components/work-order-technician-modal', () => ({
  WorkOrderTechnicianModal: () => null,
}))

const orderMock = {
  id: 'wo1',
  code: 'OT-000001',
  appointment: { id: 'a1', code: 'CITA-000001' },
  customer: { id: 'c1', documentNumber: '20123456789', name: 'Motorparts SAC' },
  vehicle: {
    id: 'v1',
    plate: 'ABC-123',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2021,
  },
  status: 'EN_DIAGNOSTICO' as const,
  technicianId: null,
  technician: null,
  subtotal: 50,
  total: 50,
  lineCount: 1,
  performedBy: 'Admin',
  diagnosisUpdatedBy: null,
  diagnosisUpdatedAt: null,
  budgetSentAt: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  decisionNotes: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function response(
  overrides: Partial<WorkOrdersResponse> = {},
): WorkOrdersResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    summary: {
      total: 0,
      recepcionadas: 0,
      enDiagnostico: 0,
      pendientesAprobacion: 0,
      aprobadas: 0,
      rechazadas: 0,
    },
    ...overrides,
  }
}

function renderPage() {
  return render(<Page />)
}

function defaultMocks(permissions: string[]) {
  auth.useAuth.mockReturnValue({ user: { permissions } })
  reactQuery.useQuery.mockReturnValue({
    data: [],
    isPending: false,
  })
}

describe('Página de órdenes de taller', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío', () => {
    defaultMocks(['workshop:read'])
    orders.useWorkOrders.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    orders.useWorkOrder.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Órdenes de taller' }),
    ).toBeTruthy()
    expect(screen.getByText('No se encontraron órdenes de taller')).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    defaultMocks(['workshop:read'])
    orders.useWorkOrders.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })
    orders.useWorkOrder.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getByLabelText('Cargando órdenes de taller')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    defaultMocks(['workshop:read'])
    orders.useWorkOrders.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })
    orders.useWorkOrder.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getByText('No se pudo cargar las órdenes')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista las órdenes con cliente, vehículo y estado, y muestra el resumen', () => {
    defaultMocks(['workshop:read'])
    orders.useWorkOrders.mockReturnValue({
      data: response({
        data: [orderMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        summary: {
          total: 1,
          recepcionadas: 0,
          enDiagnostico: 1,
          pendientesAprobacion: 0,
          aprobadas: 0,
          rechazadas: 0,
        },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    orders.useWorkOrder.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getAllByText('OT-000001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Motorparts SAC').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('ABC-123 · Toyota Hilux').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('En diagnóstico').length).toBeGreaterThan(0)
    expect(screen.getByText('en diagnóstico')).toBeTruthy()
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    defaultMocks(['workshop:read'])
    orders.useWorkOrders.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    orders.useWorkOrder.mockReturnValue({ data: undefined, isPending: false })

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Buscar órdenes' }))
    await user.type(
      await screen.findByPlaceholderText('Escribe un código, cliente o placa…'),
      'HILUX',
    )

    await waitFor(() =>
      expect(orders.useWorkOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'HILUX' }),
      ),
    )
  })
})
