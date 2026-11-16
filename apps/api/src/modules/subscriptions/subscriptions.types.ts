import type {
  BillingCycle,
  SubscriptionStatus,
} from '../../generated/prisma/client.js'

export interface PlanDto {
  id: string
  code: string
  name: string
  description: string | null
  priceMonthly: number
  priceYearly: number
  currency: string
  maxMembers: number
  maxTechnicians: number
  maxProducts: number
  features: string[]
  active: boolean
  isPublic: boolean
  activeSubscriptionsCount?: number
  createdAt: string
  updatedAt: string
}

export interface OrganizationSubscriptionDto {
  id: string
  organizationId: string
  organizationName: string
  organizationCode: string
  planId: string
  plan: PlanDto
  status: SubscriptionStatus
  billingCycle: BillingCycle
  startsAt: string
  renewsAt: string | null
  canceledAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ResourceUsageDto {
  current: number
  max: number
  percent: number
}

export interface WorkshopSubscriptionDetailsDto {
  subscription: {
    id: string
    status: SubscriptionStatus
    billingCycle: BillingCycle
    startsAt: string
    renewsAt: string | null
    canceledAt: string | null
    notes: string | null
  }
  plan: PlanDto
  usage: {
    members: ResourceUsageDto
    technicians: ResourceUsageDto
    products: ResourceUsageDto
  }
}

export interface PlatformSubscriptionMetricsDto {
  total: number
  active: number
  trial: number
  pastDue: number
  suspended: number
  estimatedMrr: number
  currency: string
}

export interface PlatformSubscriptionFilters {
  search?: string
  status?: 'all' | SubscriptionStatus
  planCode?: string
  page: number
  pageSize: number
}

export interface UpdatePlatformSubscriptionDto {
  planId?: string
  status?: SubscriptionStatus
  billingCycle?: BillingCycle
  renewsAt?: string | null
  notes?: string | null
}

export interface CreatePlanDto {
  code: string
  name: string
  description?: string | null
  priceMonthly: number
  priceYearly: number
  currency?: string
  maxMembers: number
  maxTechnicians: number
  maxProducts: number
  features?: string[]
  active?: boolean
  isPublic?: boolean
}

export interface UpdatePlanDto {
  name?: string
  description?: string | null
  priceMonthly?: number
  priceYearly?: number
  currency?: string
  maxMembers?: number
  maxTechnicians?: number
  maxProducts?: number
  features?: string[]
  active?: boolean
  isPublic?: boolean
}

export interface AssignSubscriptionDto {
  organizationId: string
  planId: string
  status?: SubscriptionStatus
  billingCycle?: BillingCycle
  startsAt?: string
  renewsAt?: string | null
  notes?: string | null
}
