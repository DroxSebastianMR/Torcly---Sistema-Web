import { afterEach, describe, expect, it, vi } from 'vitest'
import { subscriptionsRepository } from '../src/modules/subscriptions/subscriptions.repository.js'
import { subscriptionsService } from '../src/modules/subscriptions/subscriptions.service.js'

describe('subscriptionsService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockPlan = {
    id: 'plan-1',
    code: 'STARTER',
    name: 'Plan Inicial',
    description: 'Plan para talleres pequeños.',
    priceMonthly: 79,
    priceYearly: 790,
    currency: 'PEN',
    maxMembers: 3,
    maxTechnicians: 5,
    maxProducts: 250,
    features: ['Hasta 3 miembros', 'Hasta 5 técnicos'],
    active: true,
    isPublic: true,
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z'),
  }

  const mockSubscription = {
    id: 'sub-1',
    organizationId: 'org-1',
    planId: 'plan-1',
    status: 'ACTIVE' as const,
    billingCycle: 'MONTHLY' as const,
    startsAt: new Date('2026-11-01T00:00:00Z'),
    renewsAt: new Date('2026-12-01T00:00:00Z'),
    canceledAt: null,
    notes: 'Nota de prueba',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z'),
    plan: mockPlan,
    organization: {
      id: 'org-1',
      code: 'ORG01',
      name: 'Taller Central',
      active: true,
    },
  }

  it('obtiene el detalle de suscripción del taller con cálculos de consumo', async () => {
    vi.spyOn(
      subscriptionsRepository,
      'findSubscriptionByOrganizationId',
    ).mockResolvedValue(mockSubscription as any)

    vi.spyOn(
      subscriptionsRepository,
      'getOrganizationResourceCounts',
    ).mockResolvedValue({
      members: 2,
      technicians: 4,
      products: 125,
    })

    const result =
      await subscriptionsService.getWorkshopSubscriptionDetails('org-1')

    expect(result.data.plan.code).toBe('STARTER')
    expect(result.data.subscription.status).toBe('ACTIVE')
    expect(result.data.usage.members).toEqual({
      current: 2,
      max: 3,
      percent: 67,
    })
    expect(result.data.usage.technicians).toEqual({
      current: 4,
      max: 5,
      percent: 80,
    })
    expect(result.data.usage.products).toEqual({
      current: 125,
      max: 250,
      percent: 50,
    })
  })

  it('rechaza la adición de miembros cuando se alcanza el límite del plan', async () => {
    vi.spyOn(
      subscriptionsRepository,
      'findSubscriptionByOrganizationId',
    ).mockResolvedValue(mockSubscription as any)

    vi.spyOn(
      subscriptionsRepository,
      'getOrganizationResourceCounts',
    ).mockResolvedValue({
      members: 3,
      technicians: 2,
      products: 100,
    })

    await expect(
      subscriptionsService.checkMemberQuota('org-1'),
    ).rejects.toThrow(/Has alcanzado el límite máximo de 3 miembros/)
  })

  it('permite la adición de miembros si está por debajo del límite', async () => {
    vi.spyOn(
      subscriptionsRepository,
      'findSubscriptionByOrganizationId',
    ).mockResolvedValue(mockSubscription as any)

    vi.spyOn(
      subscriptionsRepository,
      'getOrganizationResourceCounts',
    ).mockResolvedValue({
      members: 2,
      technicians: 2,
      products: 100,
    })

    await expect(
      subscriptionsService.checkMemberQuota('org-1'),
    ).resolves.toBeUndefined()
  })

  it('bloquea la creación de recursos si la suscripción está suspendida', async () => {
    vi.spyOn(
      subscriptionsRepository,
      'findSubscriptionByOrganizationId',
    ).mockResolvedValue({
      ...mockSubscription,
      status: 'SUSPENDED',
    } as any)

    await expect(
      subscriptionsService.checkMemberQuota('org-1'),
    ).rejects.toThrow(/suspendida o cancelada/)

    await expect(
      subscriptionsService.checkTechnicianQuota('org-1'),
    ).rejects.toThrow(/suspendida o cancelada/)
  })

  it('rechaza la adición de técnicos cuando se alcanza el límite del plan', async () => {
    vi.spyOn(
      subscriptionsRepository,
      'findSubscriptionByOrganizationId',
    ).mockResolvedValue(mockSubscription as any)

    vi.spyOn(
      subscriptionsRepository,
      'getOrganizationResourceCounts',
    ).mockResolvedValue({
      members: 1,
      technicians: 5,
      products: 100,
    })

    await expect(
      subscriptionsService.checkTechnicianQuota('org-1'),
    ).rejects.toThrow(/Has alcanzado el límite máximo de 5 técnicos/)
  })

  it('actualiza el plan y la vigencia desde la consola de plataforma', async () => {
    vi.spyOn(subscriptionsRepository, 'findPlanById').mockResolvedValue(
      mockPlan as any,
    )
    vi.spyOn(
      subscriptionsRepository,
      'findSubscriptionByOrganizationId',
    ).mockResolvedValue(mockSubscription as any)

    const updatedSub = {
      ...mockSubscription,
      planId: 'plan-pro',
      plan: {
        ...mockPlan,
        id: 'plan-pro',
        code: 'PRO',
        name: 'Plan Profesional',
      },
      status: 'ACTIVE' as const,
      renewsAt: new Date('2027-01-01T00:00:00Z'),
    }

    vi.spyOn(subscriptionsRepository, 'updateSubscription').mockResolvedValue(
      updatedSub as any,
    )

    const result = await subscriptionsService.updatePlatformSubscription(
      'org-1',
      {
        planId: 'plan-pro',
        renewsAt: '2027-01-01T00:00:00.000Z',
      },
    )

    expect(result.data.plan.name).toBe('Plan Profesional')
    expect(result.data.renewsAt).toBe('2027-01-01T00:00:00.000Z')
  })
})
