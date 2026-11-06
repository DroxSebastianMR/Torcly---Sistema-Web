// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SubscriptionPage from './subscription-page'
import * as useSubscriptionsModule from '../hooks/use-subscriptions'

describe('SubscriptionPage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra el estado de carga mientras se obtienen los datos', () => {
    vi.spyOn(useSubscriptionsModule, 'useWorkshopSubscription').mockReturnValue(
      {
        data: undefined,
        isLoading: true,
        error: null,
      } as any,
    )

    render(<SubscriptionPage />)
    expect(
      screen.getByText('Cargando información del plan de tu taller...'),
    ).toBeTruthy()
  })

  it('muestra los detalles del plan activo y las barras de consumo de recursos', () => {
    vi.spyOn(useSubscriptionsModule, 'useWorkshopSubscription').mockReturnValue(
      {
        data: {
          data: {
            subscription: {
              id: 'sub-1',
              status: 'ACTIVE',
              billingCycle: 'MONTHLY',
              startsAt: '2026-11-01T00:00:00.000Z',
              renewsAt: '2026-12-01T00:00:00.000Z',
              canceledAt: null,
              notes: null,
            },
            plan: {
              id: 'plan-1',
              code: 'PRO',
              name: 'Plan Profesional',
              description: 'Para talleres medianos en crecimiento.',
              priceMonthly: 149,
              priceYearly: 1490,
              currency: 'PEN',
              maxMembers: 10,
              maxTechnicians: 15,
              maxProducts: 2500,
              features: [
                'Asistente IA conversacional',
                'Analítica y reportes avanzados',
              ],
              active: true,
              isPublic: true,
              createdAt: '2026-11-01T00:00:00.000Z',
              updatedAt: '2026-11-01T00:00:00.000Z',
            },
            usage: {
              members: { current: 3, max: 10, percent: 30 },
              technicians: { current: 5, max: 15, percent: 33 },
              products: { current: 350, max: 2500, percent: 14 },
            },
          },
        },
        isLoading: false,
        error: null,
      } as any,
    )

    render(<SubscriptionPage />)

    expect(screen.getByText('Plan Profesional')).toBeTruthy()
    expect(screen.getByText('Suscripción Activa')).toBeTruthy()
    expect(screen.getByText('S/ 149.00')).toBeTruthy()

    // Usage cards
    expect(screen.getByText('3 / 10')).toBeTruthy()
    expect(screen.getByText('30% utilizado')).toBeTruthy()
    expect(screen.getByText('5 / 15')).toBeTruthy()
    expect(screen.getByText('350 / 2500')).toBeTruthy()

    // Features
    expect(screen.getByText('Asistente IA conversacional')).toBeTruthy()
    expect(screen.getByText('Analítica y reportes avanzados')).toBeTruthy()
  })
})
