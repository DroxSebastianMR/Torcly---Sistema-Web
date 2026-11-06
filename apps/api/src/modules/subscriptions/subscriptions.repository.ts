import {
  Prisma,
  type SubscriptionStatus,
} from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type {
  CreatePlanDto,
  PlatformSubscriptionFilters,
  UpdatePlanDto,
  UpdatePlatformSubscriptionDto,
} from './subscriptions.types.js'

const planSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  priceMonthly: true,
  priceYearly: true,
  currency: true,
  maxMembers: true,
  maxTechnicians: true,
  maxProducts: true,
  features: true,
  active: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlanSelect

const subscriptionInclude = {
  plan: { select: planSelect },
  organization: {
    select: {
      id: true,
      code: true,
      name: true,
      active: true,
    },
  },
} satisfies Prisma.OrganizationSubscriptionInclude

export const subscriptionsRepository = {
  listActivePlans() {
    return databaseService.client.plan.findMany({
      where: { active: true },
      select: planSelect,
      orderBy: { priceMonthly: 'asc' },
    })
  },

  listAllPlans() {
    return databaseService.client.plan.findMany({
      select: planSelect,
      orderBy: [{ active: 'desc' }, { priceMonthly: 'asc' }],
    })
  },

  findPlanById(id: string) {
    return databaseService.client.plan.findUnique({
      where: { id },
      select: planSelect,
    })
  },

  findPlanByCode(code: string) {
    return databaseService.client.plan.findUnique({
      where: { code },
      select: planSelect,
    })
  },

  createPlan(data: CreatePlanDto) {
    return databaseService.client.plan.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        currency: data.currency ?? 'PEN',
        maxMembers: data.maxMembers,
        maxTechnicians: data.maxTechnicians,
        maxProducts: data.maxProducts,
        features: data.features ?? [],
        active: data.active ?? true,
        isPublic: data.isPublic ?? true,
      },
      select: planSelect,
    })
  },

  updatePlan(planId: string, data: UpdatePlanDto) {
    return databaseService.client.plan.update({
      where: { id: planId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.priceMonthly !== undefined
          ? { priceMonthly: data.priceMonthly }
          : {}),
        ...(data.priceYearly !== undefined
          ? { priceYearly: data.priceYearly }
          : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.maxMembers !== undefined
          ? { maxMembers: data.maxMembers }
          : {}),
        ...(data.maxTechnicians !== undefined
          ? { maxTechnicians: data.maxTechnicians }
          : {}),
        ...(data.maxProducts !== undefined
          ? { maxProducts: data.maxProducts }
          : {}),
        ...(data.features !== undefined ? { features: data.features } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
      },
      select: planSelect,
    })
  },

  findSubscriptionByOrganizationId(organizationId: string) {
    return databaseService.client.organizationSubscription.findUnique({
      where: { organizationId },
      include: subscriptionInclude,
    })
  },

  async listSubscriptions(filters: PlatformSubscriptionFilters) {
    const search = filters.search?.trim()
    const where: Prisma.OrganizationSubscriptionWhereInput = {
      ...(filters.status && filters.status !== 'all'
        ? { status: filters.status }
        : {}),
      ...(filters.planCode ? { plan: { code: filters.planCode } } : {}),
      ...(search
        ? {
            organization: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      databaseService.client.organizationSubscription.findMany({
        where,
        include: subscriptionInclude,
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.organizationSubscription.count({ where }),
    ])

    return { items, total }
  },

  async countMetrics() {
    const [total, active, trial, pastDue, suspended] = await Promise.all([
      databaseService.client.organizationSubscription.count(),
      databaseService.client.organizationSubscription.count({
        where: { status: 'ACTIVE' },
      }),
      databaseService.client.organizationSubscription.count({
        where: { status: 'TRIAL' },
      }),
      databaseService.client.organizationSubscription.count({
        where: { status: 'PAST_DUE' },
      }),
      databaseService.client.organizationSubscription.count({
        where: { status: 'SUSPENDED' },
      }),
    ])

    return { total, active, trial, pastDue, suspended }
  },

  async getOrganizationResourceCounts(organizationId: string) {
    const [membersCount, techniciansCount, productsCount] = await Promise.all([
      databaseService.client.organizationMembership.count({
        where: { organizationId, active: true },
      }),
      databaseService.client.technician.count({
        where: { organizationId, active: true },
      }),
      databaseService.client.product.count({
        where: { organizationId, active: true },
      }),
    ])

    return {
      members: membersCount,
      technicians: techniciansCount,
      products: productsCount,
    }
  },

  createSubscription(data: {
    organizationId: string
    planId: string
    status?: SubscriptionStatus
    billingCycle?: 'MONTHLY' | 'ANNUAL'
    startsAt?: Date
    renewsAt?: Date | null
    notes?: string | null
  }) {
    return databaseService.client.organizationSubscription.create({
      data,
      include: subscriptionInclude,
    })
  },

  upsertSubscription(data: {
    organizationId: string
    planId: string
    status?: SubscriptionStatus
    billingCycle?: 'MONTHLY' | 'ANNUAL'
    startsAt?: Date
    renewsAt?: Date | null
    notes?: string | null
  }) {
    return databaseService.client.organizationSubscription.upsert({
      where: { organizationId: data.organizationId },
      update: {
        planId: data.planId,
        ...(data.status ? { status: data.status } : {}),
        ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
        ...(data.startsAt ? { startsAt: data.startsAt } : {}),
        renewsAt: data.renewsAt,
        notes: data.notes,
        updatedAt: new Date(),
      },
      create: data,
      include: subscriptionInclude,
    })
  },

  updateSubscription(
    organizationId: string,
    data: UpdatePlatformSubscriptionDto,
  ) {
    return databaseService.client.organizationSubscription.update({
      where: { organizationId },
      data: {
        ...(data.planId ? { planId: data.planId } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
        ...(data.renewsAt !== undefined
          ? { renewsAt: data.renewsAt ? new Date(data.renewsAt) : null }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status === 'CANCELED' ? { canceledAt: new Date() } : {}),
      },
      include: subscriptionInclude,
    })
  },
}
