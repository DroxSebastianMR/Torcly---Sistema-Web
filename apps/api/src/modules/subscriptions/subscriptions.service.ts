import type {
  BillingCycle,
  SubscriptionStatus,
} from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import { subscriptionsRepository } from './subscriptions.repository.js'
import type {
  AssignSubscriptionDto,
  CreatePlanDto,
  OrganizationSubscriptionDto,
  PlanDto,
  PlatformSubscriptionFilters,
  PlatformSubscriptionMetricsDto,
  UpdatePlanDto,
  UpdatePlatformSubscriptionDto,
  WorkshopSubscriptionDetailsDto,
} from './subscriptions.types.js'

function toPlanDto(record: {
  id: string
  code: string
  name: string
  description: string | null
  priceMonthly: unknown
  priceYearly: unknown
  currency: string
  maxMembers: number
  maxTechnicians: number
  maxProducts: number
  features: unknown
  active: boolean
  isPublic: boolean
  _count?: { subscriptions?: number }
  createdAt: Date
  updatedAt: Date
}): PlanDto {
  const priceMonthly = Number(record.priceMonthly) || 0
  const priceYearly = Number(record.priceYearly) || 0

  let featuresList: string[] = []
  if (Array.isArray(record.features)) {
    featuresList = record.features.map(String)
  }

  return {
    id: record.id,
    code: record.code,
    name: record.name,
    description: record.description,
    priceMonthly,
    priceYearly,
    currency: record.currency,
    maxMembers: record.maxMembers,
    maxTechnicians: record.maxTechnicians,
    maxProducts: record.maxProducts,
    features: featuresList,
    active: record.active,
    isPublic: record.isPublic,
    activeSubscriptionsCount:
      record._count?.subscriptions !== undefined
        ? record._count.subscriptions
        : undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toSubscriptionDto(record: {
  id: string
  organizationId: string
  organization: {
    id: string
    code: string
    name: string
    active: boolean
  }
  planId: string
  plan: Parameters<typeof toPlanDto>[0]
  status: SubscriptionStatus
  billingCycle: BillingCycle
  startsAt: Date
  renewsAt: Date | null
  canceledAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}): OrganizationSubscriptionDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    organizationName: record.organization.name,
    organizationCode: record.organization.code,
    planId: record.planId,
    plan: toPlanDto(record.plan),
    status: record.status,
    billingCycle: record.billingCycle,
    startsAt: record.startsAt.toISOString(),
    renewsAt: record.renewsAt ? record.renewsAt.toISOString() : null,
    canceledAt: record.canceledAt ? record.canceledAt.toISOString() : null,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export const subscriptionsService = {
  async ensureOrganizationSubscription(organizationId: string) {
    let subscription =
      await subscriptionsRepository.findSubscriptionByOrganizationId(
        organizationId,
      )

    if (!subscription) {
      let proPlan = await subscriptionsRepository.findPlanByCode('PRO')
      if (!proPlan) {
        const plans = await subscriptionsRepository.listActivePlans()
        proPlan = plans[0] ?? null
      }

      if (proPlan) {
        subscription = await subscriptionsRepository.createSubscription({
          organizationId,
          planId: proPlan.id,
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          startsAt: new Date(),
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: 'Suscripción asignada automáticamente por autosanación.',
        })
      }
    }

    return subscription
  },

  async getWorkshopSubscriptionDetails(
    organizationId: string,
  ): Promise<{ data: WorkshopSubscriptionDetailsDto }> {
    const subscription =
      await this.ensureOrganizationSubscription(organizationId)

    if (!subscription) {
      throw new AppError(
        404,
        'SUBSCRIPTION_NOT_FOUND',
        'No se encontró una suscripción activa para la organización.',
      )
    }

    const counts =
      await subscriptionsRepository.getOrganizationResourceCounts(
        organizationId,
      )

    const plan = toPlanDto(subscription.plan)

    const memberPercent = Math.min(
      100,
      Math.round((counts.members / plan.maxMembers) * 100),
    )
    const technicianPercent = Math.min(
      100,
      Math.round((counts.technicians / plan.maxTechnicians) * 100),
    )
    const productPercent = Math.min(
      100,
      Math.round((counts.products / plan.maxProducts) * 100),
    )

    return {
      data: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          startsAt: subscription.startsAt.toISOString(),
          renewsAt: subscription.renewsAt
            ? subscription.renewsAt.toISOString()
            : null,
          canceledAt: subscription.canceledAt
            ? subscription.canceledAt.toISOString()
            : null,
          notes: subscription.notes,
        },
        plan,
        usage: {
          members: {
            current: counts.members,
            max: plan.maxMembers,
            percent: memberPercent,
          },
          technicians: {
            current: counts.technicians,
            max: plan.maxTechnicians,
            percent: technicianPercent,
          },
          products: {
            current: counts.products,
            max: plan.maxProducts,
            percent: productPercent,
          },
        },
      },
    }
  },

  async checkMemberQuota(organizationId: string) {
    const subscription =
      await this.ensureOrganizationSubscription(organizationId)
    if (!subscription) return

    if (
      subscription.status === 'SUSPENDED' ||
      subscription.status === 'CANCELED'
    ) {
      throw new AppError(
        409,
        'SUBSCRIPTION_INACTIVE',
        'La suscripción del taller se encuentra suspendida o cancelada. Reactívala para añadir más miembros.',
      )
    }

    const counts =
      await subscriptionsRepository.getOrganizationResourceCounts(
        organizationId,
      )

    if (counts.members >= subscription.plan.maxMembers) {
      throw new AppError(
        409,
        'QUOTA_EXCEEDED_MEMBERS',
        `Has alcanzado el límite máximo de ${subscription.plan.maxMembers} miembros de tu ${subscription.plan.name}. Mejora tu plan para añadir más miembros.`,
      )
    }
  },

  async checkTechnicianQuota(organizationId: string) {
    const subscription =
      await this.ensureOrganizationSubscription(organizationId)
    if (!subscription) return

    if (
      subscription.status === 'SUSPENDED' ||
      subscription.status === 'CANCELED'
    ) {
      throw new AppError(
        409,
        'SUBSCRIPTION_INACTIVE',
        'La suscripción del taller se encuentra suspendida o cancelada. Reactívala para añadir más técnicos.',
      )
    }

    const counts =
      await subscriptionsRepository.getOrganizationResourceCounts(
        organizationId,
      )

    if (counts.technicians >= subscription.plan.maxTechnicians) {
      throw new AppError(
        409,
        'QUOTA_EXCEEDED_TECHNICIANS',
        `Has alcanzado el límite máximo de ${subscription.plan.maxTechnicians} técnicos de tu ${subscription.plan.name}. Mejora tu plan para añadir más técnicos.`,
      )
    }
  },

  async listPlatformSubscriptions(filters: PlatformSubscriptionFilters) {
    const { items, total } =
      await subscriptionsRepository.listSubscriptions(filters)

    return {
      data: items.map(toSubscriptionDto),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
      },
    }
  },

  async getPlatformSubscriptionMetrics(): Promise<{
    data: PlatformSubscriptionMetricsDto
  }> {
    const metrics = await subscriptionsRepository.countMetrics()
    return { data: metrics }
  },

  async listPlatformPlans(): Promise<{ data: PlanDto[] }> {
    const plans = await subscriptionsRepository.listAllPlans()
    return { data: plans.map(toPlanDto) }
  },

  async createPlan(input: CreatePlanDto): Promise<{ data: PlanDto }> {
    const existing = await subscriptionsRepository.findPlanByCode(input.code)
    if (existing) {
      throw new AppError(
        409,
        'PLAN_DUPLICATE',
        `Ya existe un plan con el código ${input.code}.`,
      )
    }

    const plan = await subscriptionsRepository.createPlan(input)
    return { data: toPlanDto(plan) }
  },

  async updatePlan(
    planId: string,
    input: UpdatePlanDto,
  ): Promise<{ data: PlanDto }> {
    const existing = await subscriptionsRepository.findPlanById(planId)
    if (!existing) {
      throw new AppError(404, 'PLAN_NOT_FOUND', 'Plan no encontrado.')
    }

    if (input.active === false && existing.active === true) {
      const activeCount =
        await subscriptionsRepository.countActiveSubscriptionsForPlan(planId)
      if (activeCount > 0) {
        throw new AppError(
          409,
          'PLAN_IN_USE',
          `No se puede desactivar el plan "${existing.name}" porque actualmente está asignado a ${activeCount} taller(es) con membresía activa. Modifica o migra primero sus suscripciones antes de desactivarlo.`,
        )
      }
    }

    const plan = await subscriptionsRepository.updatePlan(planId, input)
    return { data: toPlanDto(plan) }
  },

  async assignOrganizationSubscription(input: AssignSubscriptionDto) {
    const plan = await subscriptionsRepository.findPlanById(input.planId)
    if (!plan || !plan.active) {
      throw new AppError(
        400,
        'PLAN_NOT_FOUND',
        'El plan seleccionado no existe o no está activo.',
      )
    }

    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date()
    let renewsAt: Date | null = null
    if (input.renewsAt !== undefined) {
      renewsAt = input.renewsAt ? new Date(input.renewsAt) : null
    } else {
      const days = input.billingCycle === 'ANNUAL' ? 365 : 30
      renewsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000)
    }

    const subscription = await subscriptionsRepository.upsertSubscription({
      organizationId: input.organizationId,
      planId: input.planId,
      status: input.status ?? 'ACTIVE',
      billingCycle: input.billingCycle ?? 'ANNUAL',
      startsAt,
      renewsAt,
      notes: input.notes ?? null,
    })

    return { data: toSubscriptionDto(subscription) }
  },

  async updatePlatformSubscription(
    organizationId: string,
    input: UpdatePlatformSubscriptionDto,
  ) {
    if (input.planId) {
      const plan = await subscriptionsRepository.findPlanById(input.planId)
      if (!plan || !plan.active) {
        throw new AppError(
          400,
          'PLAN_NOT_FOUND',
          'El plan seleccionado no existe o no está activo.',
        )
      }
    }

    const existing =
      await subscriptionsRepository.findSubscriptionByOrganizationId(
        organizationId,
      )
    if (!existing) {
      throw new AppError(
        404,
        'SUBSCRIPTION_NOT_FOUND',
        'No se encontró la suscripción para esta organización.',
      )
    }

    const updated = await subscriptionsRepository.updateSubscription(
      organizationId,
      input,
    )

    return { data: toSubscriptionDto(updated) }
  },
}
