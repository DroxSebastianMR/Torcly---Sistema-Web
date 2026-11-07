export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'SUSPENDED'

export type BillingCycle = 'MONTHLY' | 'ANNUAL'

export interface Plan {
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

export interface OrganizationSubscription {
  id: string
  organizationId: string
  organizationName: string
  organizationCode: string
  planId: string
  plan: Plan
  status: SubscriptionStatus
  billingCycle: BillingCycle
  startsAt: string
  renewsAt: string | null
  canceledAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ResourceUsage {
  current: number
  max: number
  percent: number
}

export interface WorkshopSubscriptionDetails {
  subscription: {
    id: string
    status: SubscriptionStatus
    billingCycle: BillingCycle
    startsAt: string
    renewsAt: string | null
    canceledAt: string | null
    notes: string | null
  }
  plan: Plan
  usage: {
    members: ResourceUsage
    technicians: ResourceUsage
    products: ResourceUsage
  }
}

export interface PlatformSubscriptionMetrics {
  total: number
  active: number
  trial: number
  pastDue: number
  suspended: number
  estimatedMrr?: number
  currency?: string
}

export interface PlatformSubscriptionFilters {
  search?: string
  status?: 'all' | SubscriptionStatus
  planCode?: string
  page: number
  pageSize: number
}

export interface PlatformSubscriptionsResponse {
  data: OrganizationSubscription[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface UpdatePlatformSubscriptionInput {
  planId?: string
  status?: SubscriptionStatus
  billingCycle?: BillingCycle
  renewsAt?: string | null
  notes?: string | null
}

export interface AssignSubscriptionInput {
  organizationId: string
  planId: string
  status?: SubscriptionStatus
  billingCycle?: BillingCycle
  startsAt?: string
  renewsAt?: string | null
  notes?: string | null
}

export interface CreatePlanInput {
  code: string
  name: string
  description?: string | null
  priceMonthly: number
  priceYearly: number
  currency?: string
  maxMembers: number
  maxTechnicians: number
  maxProducts: number
  features: string[]
  active?: boolean
  isPublic?: boolean
}

export interface UpdatePlanInput {
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
