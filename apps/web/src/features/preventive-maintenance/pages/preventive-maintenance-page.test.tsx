// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any -- Mocks de consulta para la vista preventiva. */

import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PreventiveMaintenancePage from './preventive-maintenance-page'
import * as usePreventiveMaintenanceModule from '../hooks/use-preventive-maintenance'

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('PreventiveMaintenancePage', () => {
  const mockItems = Array.from({ length: 15 }, (_, i) => ({
    vehicleId: `veh-${i + 1}`,
    plate: `ABC-00${i + 1}`,
    brand: 'Toyota',
    model: 'Yaris',
    year: 2021,
    lastMileage: 40000 + i * 1000,
    customer: {
      id: `cust-${i + 1}`,
      name: `Cliente ${i + 1}`,
      phone: '987654321',
      documentNumber: `1234567${i}`,
    },
    lastServiceDate: '2026-05-10',
    daysSinceLastService: 180 + i,
    lastOrderCode: `OT-0000${i + 1}`,
    priority: i === 0 ? 'CRITICAL' : i < 5 ? 'WARNING' : 'UP_TO_DATE',
    recommendedService: 'Mantenimiento Preventivo 45,000 km',
    suggestedMessage: 'Hola, tu auto necesita revisión.',
  }))

  beforeEach(() => {
    vi.spyOn(
      usePreventiveMaintenanceModule,
      'usePreventiveMaintenance',
    ).mockReturnValue({
      data: {
        data: mockItems,
        metrics: {
          criticalCount: 1,
          warningCount: 4,
          upToDateCount: 10,
          totalVehiclesAnalyzed: 15,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renderiza encabezado, tarjeta de frecuencia sugerida con CalendarClock y KPIs estándar', () => {
    renderWithClient(<PreventiveMaintenancePage />)

    expect(
      screen.getByRole('heading', { name: /mantenimiento preventivo/i }),
    ).toBeTruthy()
    expect(
      screen.getByText(/frecuencia sugerida: 5,000 km o 6 meses/i),
    ).toBeTruthy()
    expect(screen.getByText('Mantenimiento vencido')).toBeTruthy()
    expect(screen.getByText('Por vencer')).toBeTruthy()
    expect(screen.getByText('Mantenimiento al día')).toBeTruthy()
    expect(screen.getByText('Total analizados')).toBeTruthy()
  })

  it('no contiene título dentro de la tabla y aplica paginación de 10 en 10', () => {
    renderWithClient(<PreventiveMaintenancePage />)

    // No debe tener los títulos anteriores removidos
    expect(
      screen.queryByText(/alertas y oportunidades de servicio/i),
    ).toBeNull()
    expect(screen.queryByText(/15 vehículos/i)).toBeNull()

    // En la primera página sólo deben renderizarse 10 vehículos
    expect(screen.getByText('ABC-001')).toBeTruthy()
    expect(screen.getByText('ABC-0010')).toBeTruthy()
    expect(screen.queryByText('ABC-0011')).toBeNull()

    // Debe mostrar la barra de paginación
    expect(screen.getByText(/página 1 de 2/i)).toBeTruthy()
  })
})
