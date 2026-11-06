import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  OrganizationSubscription,
  Plan,
  PlatformSubscriptionFilters,
  PlatformSubscriptionMetrics,
  PlatformSubscriptionsResponse,
  UpdatePlatformSubscriptionInput,
  WorkshopSubscriptionDetails,
} from '../types/subscriptions.types'

function query(filters: PlatformSubscriptionFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status)
  }
  if (filters.planCode) {
    params.set('planCode', filters.planCode)
  }
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }
  return params.toString()
}

export const subscriptionsService = {
  getWorkshopSubscription: (signal?: AbortSignal) =>
    api.get<{ data: WorkshopSubscriptionDetails }>(
      endpoints.subscriptions.current,
      signal,
    ),

  listPlatformPlans: (signal?: AbortSignal) =>
    api.get<{ data: Plan[] }>(endpoints.platform.plans, signal),

  getPlatformSubscriptionMetrics: (signal?: AbortSignal) =>
    api.get<{ data: PlatformSubscriptionMetrics }>(
      endpoints.platform.subscriptionMetrics,
      signal,
    ),

  listPlatformSubscriptions: (
    filters: PlatformSubscriptionFilters,
    signal?: AbortSignal,
  ) =>
    api.get<PlatformSubscriptionsResponse>(
      `${endpoints.platform.subscriptions}?${query(filters)}`,
      signal,
    ),

  updatePlatformSubscription: (
    organizationId: string,
    input: UpdatePlatformSubscriptionInput,
  ) =>
    api.patch<{ data: OrganizationSubscription }>(
      endpoints.platform.subscription(organizationId),
      input,
    ),
}
