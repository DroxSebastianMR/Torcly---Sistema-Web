import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { servicesService } from '../services/services.service'
import type { ServiceFilters, ServiceInput } from '../types/services.types'

export const serviceKeys = {
  all: ['services'] as const,
  list: (filters: ServiceFilters) =>
    [...serviceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
  options: () => [...serviceKeys.all, 'options'] as const,
  codeAvailability: (code: string, excludeId?: string) =>
    [...serviceKeys.all, 'code-availability', code, excludeId] as const,
}

export function useServices(filters: ServiceFilters) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: ({ signal }) => servicesService.list(filters, signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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

export function useServiceCodeAvailability(
  code: string,
  excludeId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: serviceKeys.codeAvailability(code, excludeId),
    queryFn: ({ signal }) =>
      servicesService.checkCodeAvailability(code, excludeId, signal),
    enabled: enabled && code.length >= 2,
    select: (response) => response.data,
    staleTime: 15_000,
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
      onMutate: () => ({ toastId: startActionToast('Registrando servicio…') }),
      onSuccess: refreshServices,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ServiceInput }) =>
        servicesService.update(id, input),
      onMutate: () => ({ toastId: startActionToast('Actualizando servicio…') }),
      onSuccess: refreshServices,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    status: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        servicesService.updateStatus(id, active),
      onMutate: ({ active }) => ({
        toastId: startActionToast(
          active ? 'Activando servicio…' : 'Desactivando servicio…',
        ),
      }),
      onSuccess: refreshServices,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
