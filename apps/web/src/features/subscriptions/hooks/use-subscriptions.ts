import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionsService } from '../services/subscriptions.service'
import type {
  AssignSubscriptionInput,
  CreatePlanInput,
  PlatformSubscriptionFilters,
  UpdatePlanInput,
  UpdatePlatformSubscriptionInput,
} from '../types/subscriptions.types'

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  workshop: ['subscriptions', 'workshop'] as const,
  platform: ['platform', 'subscriptions'] as const,
  platformList: (filters: PlatformSubscriptionFilters) =>
    ['platform', 'subscriptions', 'list', filters] as const,
  platformMetrics: ['platform', 'subscriptions', 'metrics'] as const,
  platformPlans: ['platform', 'plans'] as const,
}

export function useWorkshopSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.workshop,
    queryFn: ({ signal }) =>
      subscriptionsService.getWorkshopSubscription(signal),
    staleTime: 30_000,
  })
}

export function usePlatformPlans() {
  return useQuery({
    queryKey: subscriptionKeys.platformPlans,
    queryFn: ({ signal }) => subscriptionsService.listPlatformPlans(signal),
    staleTime: 5 * 60_000,
  })
}

export function usePlatformSubscriptionMetrics() {
  return useQuery({
    queryKey: subscriptionKeys.platformMetrics,
    queryFn: ({ signal }) =>
      subscriptionsService.getPlatformSubscriptionMetrics(signal),
    staleTime: 30_000,
  })
}

export function usePlatformSubscriptions(filters: PlatformSubscriptionFilters) {
  return useQuery({
    queryKey: subscriptionKeys.platformList(filters),
    queryFn: ({ signal }) =>
      subscriptionsService.listPlatformSubscriptions(filters, signal),
    staleTime: 30_000,
  })
}

export function useUpdatePlatformSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      input,
    }: {
      organizationId: string
      input: UpdatePlatformSubscriptionInput
    }) =>
      subscriptionsService.updatePlatformSubscription(organizationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.platform,
      })
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.workshop,
      })
    },
  })
}

export function useAssignSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignSubscriptionInput) =>
      subscriptionsService.assignSubscription(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.platform,
      })
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.workshop,
      })
    },
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlanInput) =>
      subscriptionsService.createPlan(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.platformPlans,
      })
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      input,
    }: {
      planId: string
      input: UpdatePlanInput
    }) => subscriptionsService.updatePlan(planId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.platformPlans,
      })
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.platform,
      })
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.workshop,
      })
    },
  })
}
