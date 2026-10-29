import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { maintenanceService } from '../services/maintenance.service'
import type { MaintenanceScheduleInput } from '../types/maintenance.types'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  status: () => [...maintenanceKeys.all, 'status'] as const,
  windows: () => [...maintenanceKeys.all, 'windows'] as const,
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: maintenanceKeys.status(),
    queryFn: ({ signal }) => maintenanceService.status(signal),
    staleTime: 60000,
  })
}

export function useMaintenanceWindows() {
  return useQuery({
    queryKey: maintenanceKeys.windows(),
    queryFn: ({ signal }) => maintenanceService.windows(signal),
  })
}

export function useMaintenanceMutations() {
  const queryClient = useQueryClient()
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
  }

  return {
    schedule: useMutation({
      mutationFn: (input: MaintenanceScheduleInput) =>
        maintenanceService.schedule(input),
      onMutate: () => ({
        toastId: startActionToast('Programando mantenimiento…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    cancel: useMutation({
      mutationFn: (id: string) => maintenanceService.cancel(id),
      onMutate: () => ({
        toastId: startActionToast('Cancelando mantenimiento…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
