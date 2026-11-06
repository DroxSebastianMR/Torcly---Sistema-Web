// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any -- Los mocks parciales aíslan el resumen de aforo. */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { YardCapacityWidget } from './yard-capacity-widget'
import * as useWorkOrdersModule from '../hooks/use-work-orders'

describe('YardCapacityWidget', () => {
  beforeEach(() => {
    vi.spyOn(useWorkOrdersModule, 'useYardCapacity').mockReturnValue({
      data: {
        maxCapacity: 8,
        occupiedBays: 5,
        availableBays: 3,
        occupancyRate: 62.5,
        isAtCapacity: false,
        todayEntriesCount: 7,
        todayWalkInsCount: 4,
        todayAppointmentsCount: 3,
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

  it('renderiza la capacidad de patio y el desglose de ingresos del día', () => {
    render(<YardCapacityWidget />)

    expect(screen.getByText('Aforo y Capacidad de Patio')).toBeTruthy()
    expect(screen.getByText('3 bahías disponibles')).toBeTruthy()
    expect(screen.getByText('de 8 bahías ocupadas (62.5%)')).toBeTruthy()
    expect(screen.getByText('4 directos')).toBeTruthy()
    expect(screen.getByText('3 citas')).toBeTruthy()
  })

  it('muestra la alerta de patio lleno cuando la capacidad es 8/8', () => {
    vi.spyOn(useWorkOrdersModule, 'useYardCapacity').mockReturnValue({
      data: {
        maxCapacity: 8,
        occupiedBays: 8,
        availableBays: 0,
        occupancyRate: 100,
        isAtCapacity: true,
        todayEntriesCount: 8,
        todayWalkInsCount: 5,
        todayAppointmentsCount: 3,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    render(<YardCapacityWidget />)

    expect(screen.getByText('Patio lleno (8/8)')).toBeTruthy()
    expect(
      screen.getByText(/Capacidad máxima física alcanzada \(8\/8 vehículos\)/i),
    ).toBeTruthy()
  })
})
