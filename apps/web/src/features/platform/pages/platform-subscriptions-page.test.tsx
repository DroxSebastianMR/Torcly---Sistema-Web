// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlatformSubscriptionsPage from './platform-subscriptions-page'
import * as useSubscriptionsModule from '@/features/subscriptions/hooks/use-subscriptions'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

describe('PlatformSubscriptionsPage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  const mockPlans = [
    {
      id: 'plan-1',
      code: 'PRO',
      name: 'Plan Profesional',
      description: 'Plan profesional para talleres.',
      priceMonthly: 149,
      priceYearly: 1490,
      currency: 'PEN',
      maxMembers: 10,
      maxTechnicians: 15,
      maxProducts: 2500,
      features: ['Asistente IA'],
      active: true,
      isPublic: true,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ]

  const mockSubscriptions = [
    {
      id: 'sub-1',
      organizationId: 'org-1',
      organizationName: 'Taller Central San Isidro',
      organizationCode: 'CENTRAL-01',
      planId: 'plan-1',
      plan: mockPlans[0]!,
      status: 'ACTIVE' as const,
      billingCycle: 'MONTHLY' as const,
      startsAt: '2026-11-01T00:00:00.000Z',
      renewsAt: '2026-12-01T00:00:00.000Z',
      canceledAt: null,
      notes: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ]

  it('muestra las métricas de suscripciones y la lista de talleres', () => {
    vi.spyOn(
      useSubscriptionsModule,
      'usePlatformSubscriptionMetrics',
    ).mockReturnValue({
      data: {
        data: {
          total: 5,
          active: 4,
          trial: 1,
          pastDue: 0,
          suspended: 0,
        },
      },
      isLoading: false,
    } as any)

    vi.spyOn(useSubscriptionsModule, 'usePlatformPlans').mockReturnValue({
      data: { data: mockPlans },
      isLoading: false,
    } as any)

    vi.spyOn(
      useSubscriptionsModule,
      'usePlatformSubscriptions',
    ).mockReturnValue({
      data: {
        data: mockSubscriptions,
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      },
      isLoading: false,
    } as any)

    vi.spyOn(
      useSubscriptionsModule,
      'useUpdatePlatformSubscription',
    ).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<PlatformSubscriptionsPage />)

    // Header & Metrics
    expect(screen.getByText('Suscripciones y Membresías')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy() // total
    expect(screen.getByText('4')).toBeTruthy() // activas

    // Table
    expect(screen.getByText('Taller Central San Isidro')).toBeTruthy()
    expect(screen.getByText('CENTRAL-01')).toBeTruthy()
    expect(screen.getByText('Plan Profesional')).toBeTruthy()
    expect(screen.getByText('Activa')).toBeTruthy()
  })

  it('abre el modal de gestión de suscripción al hacer clic en Gestionar', async () => {
    vi.spyOn(
      useSubscriptionsModule,
      'usePlatformSubscriptionMetrics',
    ).mockReturnValue({
      data: {
        data: { total: 1, active: 1, trial: 0, pastDue: 0, suspended: 0 },
      },
      isLoading: false,
    } as any)

    vi.spyOn(useSubscriptionsModule, 'usePlatformPlans').mockReturnValue({
      data: { data: mockPlans },
      isLoading: false,
    } as any)

    vi.spyOn(
      useSubscriptionsModule,
      'usePlatformSubscriptions',
    ).mockReturnValue({
      data: {
        data: mockSubscriptions,
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      },
      isLoading: false,
    } as any)

    vi.spyOn(
      useSubscriptionsModule,
      'useUpdatePlatformSubscription',
    ).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<PlatformSubscriptionsPage />)

    const manageBtn = screen.getByRole('button', { name: /gestionar/i })
    await userEvent.click(manageBtn)

    expect(screen.getByText('Gestionar Suscripción SaaS')).toBeTruthy()
    expect(
      screen.getByText(
        /Configuración de plan y vigencia para Taller Central San Isidro/,
      ),
    ).toBeTruthy()
  })
})
