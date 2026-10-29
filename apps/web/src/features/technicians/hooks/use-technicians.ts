import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { techniciansService } from '../services/technicians.service'
import type {
  TechnicianFilters,
  TechnicianInput,
} from '../types/technicians.types'
export const technicianKeys = {
  all: ['technicians'] as const,
  list: (filters: TechnicianFilters) =>
    ['technicians', 'list', filters] as const,
}
export const useTechnicians = (filters: TechnicianFilters) =>
  useQuery({
    queryKey: technicianKeys.list(filters),
    queryFn: ({ signal }) => techniciansService.list(filters, signal),
    staleTime: 30_000,
  })
export function useTechnicianMutations() {
  const client = useQueryClient()
  const refresh = () =>
    client.invalidateQueries({ queryKey: technicianKeys.all })
  return {
    create: useMutation({
      mutationFn: (input: TechnicianInput) => techniciansService.create(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: TechnicianInput }) =>
        techniciansService.update(id, input),
      onSuccess: refresh,
    }),
    status: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        techniciansService.status(id, active),
      onSuccess: refresh,
    }),
  }
}
