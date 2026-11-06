// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PlatformSubscriptionsPage from './platform-subscriptions-page'
import * as usePlatformOrgsModule from '@/features/platform/hooks/use-platform-organizations'
import * as useSubscriptionsModule from '@/features/subscriptions/hooks/use-subscriptions'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

describe('PlatformSubscriptionsPage', () => {
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
      features: ['Asistente IA', 'Facturación ilimitada'],
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

  const mockOrganizations = [
    {
      id: 'org-1',
      name: 'Taller Central San Isidro',
      code: 'CENTRAL-01',
      active: true,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'org-2',
      name: 'Taller Norte Los Olivos',
      code: 'NORTE-02',
      active: true,
      createdAt: '2026-11-02T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
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

    vi.spyOn(useSubscriptionsModule, 'useAssignSubscription').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.spyOn(useSubscriptionsModule, 'useCreatePlan').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.spyOn(useSubscriptionsModule, 'useUpdatePlan').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.spyOn(usePlatformOrgsModule, 'usePlatformOrganizations').mockReturnValue(
      {
        data: { data: mockOrganizations },
        isLoading: false,
      } as any,
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('muestra las métricas de suscripciones y la lista de talleres', () => {
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

    // Assign button is visible in header
    expect(
      screen.getByRole('button', { name: /asignar membresía/i }),
    ).toBeTruthy()
  })

  it('abre el modal de gestión de suscripción al hacer clic en Gestionar', async () => {
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

  it('abre el modal de asignación de membresía al hacer clic en Asignar Membresía', async () => {
    render(<PlatformSubscriptionsPage />)

    const assignBtn = screen.getByRole('button', { name: /asignar membresía/i })
    await userEvent.click(assignBtn)

    expect(screen.getByText('Asignar Nueva Membresía SaaS')).toBeTruthy()
    expect(
      screen.getByText(
        /Vincula o actualiza el plan comercial y la vigencia para un taller existente/,
      ),
    ).toBeTruthy()
  })

  it('permite cambiar a la pestaña de Planes Comerciales y ver las tarjetas con sus cuotas', async () => {
    render(<PlatformSubscriptionsPage />)

    const plansTabBtn = screen.getByRole('button', {
      name: /planes comerciales/i,
    })
    await userEvent.click(plansTabBtn)

    // Shows plan info
    expect(screen.getAllByText('Plan Profesional').length).toBeGreaterThan(0)
    expect(screen.getByText('S/ 149')).toBeTruthy()
    expect(screen.getByText(/1490/)).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy() // maxMembers
    expect(screen.getByText('15')).toBeTruthy() // maxTechnicians
    expect(screen.getByText('2500')).toBeTruthy() // maxProducts
    expect(screen.getByText('Asistente IA')).toBeTruthy()

    // Shows edit plan button
    const editPlanBtn = screen.getByRole('button', { name: /editar plan/i })
    expect(editPlanBtn).toBeTruthy()
  })

  it('abre el modal de edición de plan al hacer clic en Editar Plan', async () => {
    render(<PlatformSubscriptionsPage />)

    const plansTabBtn = screen.getByRole('button', {
      name: /planes comerciales/i,
    })
    await userEvent.click(plansTabBtn)

    const editPlanBtn = screen.getByRole('button', { name: /editar plan/i })
    await userEvent.click(editPlanBtn)

    expect(screen.getByText('Editar Plan: Plan Profesional')).toBeTruthy()
    expect(screen.getByDisplayValue('Plan Profesional')).toBeTruthy()
  })

  it('abre el modal de creación de plan al hacer clic en Nuevo Plan en la pestaña de planes', async () => {
    render(<PlatformSubscriptionsPage />)

    const plansTabBtn = screen.getByRole('button', {
      name: /planes comerciales/i,
    })
    await userEvent.click(plansTabBtn)

    const newPlanBtn = screen.getByRole('button', { name: /nuevo plan/i })
    await userEvent.click(newPlanBtn)

    expect(screen.getByText('Crear Nuevo Plan Comercial')).toBeTruthy()
  })
})
