import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesService } from '../services/services.service'
import type { ServiceFilters, ServiceInput } from '../types/services.types'

export const serviceKeys = {
  all: ['services'] as const,
  list: (filters: ServiceFilters) =>
    [...serviceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
  options: () => [...serviceKeys.all, 'options'] as const,
}

export function useServices(filters: ServiceFilters) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: ({ signal }) => servicesService.list(filters, signal),
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: ({ signal }) => servicesService.get(id, signal),
    enabled: Boolean(id),
    select: (response) => response.data,
  })
}

export function useServiceOptions() {
  return useQuery({
    queryKey: serviceKeys.options(),
    queryFn: ({ signal }) => servicesService.options(signal),
    select: (response) => response.data,
  })
}

export function useServiceMutations() {
  const queryClient = useQueryClient()
  const refreshServices = async () => {
    await queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    await queryClient.invalidateQueries({ queryKey: ['sales', 'catalog'] })
  }

  return {
    create: useMutation({
      mutationFn: (input: ServiceInput) => servicesService.create(input),
      onSuccess: refreshServices,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ServiceInput }) =>
        servicesService.update(id, input),
      onSuccess: refreshServices,
    }),
    status: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        servicesService.updateStatus(id, active),
      onSuccess: refreshServices,
    }),
  }
}
