// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Page from './dashboard-page'

const operations = vi.hoisted(() => ({
  useOperationsSummary: vi.fn(),
  useOperationsAttention: vi.fn(),
}))

vi.mock('../hooks/use-operations', () => operations)

const query = (data: unknown) => ({ data, isError: false, isPending: false })

describe('Dashboard operativo', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra una vista diaria concisa con agenda y alertas', () => {
    operations.useOperationsSummary
      .mockReturnValueOnce(
        query({
          sections: {
            appointments: { total: 12 },
            workOrders: { byStatus: { EN_EJECUCION: 2 } },
            sales: { confirmedCount: 1 },
            payments: { pendingCount: 1, pendingAmount: 220 },
            inventory: { lowStockCount: 2 },
          },
        }),
      )
      .mockReturnValueOnce(query({ sections: { appointments: { total: 3 } } }))
    operations.useOperationsAttention
      .mockReturnValueOnce(
        query({
          data: [
            {
              code: 'CITA-000001',
              date: '2026-10-30',
              time: '09:00',
              customerName: 'Ana López',
              vehiclePlate: 'ABC123',
            },
          ],
        }),
      )
      .mockReturnValueOnce(
        query({
          data: [
            {
              code: 'ACEITE-01',
              name: 'Aceite',
              stock: 2,
              minimumStock: 5,
              unitLabel: 'und',
            },
          ],
        }),
      )
      .mockReturnValueOnce(
        query({
          data: [
            {
              code: 'VENTA-000001',
              customerName: 'Ana López',
              confirmedAt: '2026-10-30',
              total: 120,
            },
          ],
        }),
      )

    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Bienvenido de vuelta' }),
    ).toBeTruthy()
    expect(screen.getByText('Citas para hoy')).toBeTruthy()
    expect(screen.getByText('Cobros pendientes')).toBeTruthy()
    expect(screen.getByText('Próximas citas')).toBeTruthy()
    expect(screen.getByText('Inventario por revisar')).toBeTruthy()
    expect(screen.getByText('Actividad reciente')).toBeTruthy()
    expect(screen.getByText('Estado del taller')).toBeTruthy()
    expect(screen.queryByText('Consulta operativa')).toBeNull()
    expect(operations.useOperationsSummary).toHaveBeenCalledTimes(2)
  })
})
