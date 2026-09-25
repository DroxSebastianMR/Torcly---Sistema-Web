import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useVehicles(filters: VehicleFilters) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: ({ signal }) => vehiclesService.list(filters, signal),
    placeholderData: (previous) => previous,
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
  const refreshVehicles = async () => {
    await queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: VehicleCreateInput) => vehiclesService.create(input),
      onSuccess: refreshVehicles,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: VehicleUpdateInput }) =>
        vehiclesService.update(id, input),
      onSuccess: refreshVehicles,
    }),
  }
}
