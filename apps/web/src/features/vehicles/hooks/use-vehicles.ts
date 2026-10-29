import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { vehiclesService } from '../services/vehicles.service'
import type {
  VehicleCreateInput,
  VehicleFilters,
  VehicleUpdateInput,
} from '../types/vehicles.types'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (filters: VehicleFilters) =>
    [...vehicleKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
}

export function useVehicles(filters: VehicleFilters, enabled = true) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: ({ signal }) => vehiclesService.list(filters, signal),
    placeholderData: (previous) => previous,
    enabled,
    staleTime: 15_000,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: ({ signal }) => vehiclesService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useVehiclesByCustomer(customerId: string, pageSize = 50) {
  return useVehicles({ search: '', customerId, page: 1, pageSize })
}

export function useVehicleMutations() {
  const queryClient = useQueryClient()
  const refreshVehicles = () => {
    void queryClient.invalidateQueries({
      queryKey: [...vehicleKeys.all, 'list'],
    })
    void queryClient.invalidateQueries({
      queryKey: [...vehicleKeys.all, 'detail'],
      refetchType: 'none',
    })
  }

  return {
    create: useMutation({
      mutationFn: (input: VehicleCreateInput) => vehiclesService.create(input),
      onMutate: () => ({ toastId: startActionToast('Registrando vehículo…') }),
      onSuccess: refreshVehicles,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: VehicleUpdateInput }) =>
        vehiclesService.update(id, input),
      onMutate: () => ({ toastId: startActionToast('Actualizando vehículo…') }),
      onSuccess: refreshVehicles,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
