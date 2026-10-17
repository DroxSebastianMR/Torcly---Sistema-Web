import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { replenishmentService } from '../services/replenishment.service'
import type {
  EligibilityFilters,
  RunDetailFilters,
  RunHistoryFilters,
  RunInput,
} from '../types/replenishment.types'

export const replenishmentKeys = {
  all: ['replenishment'] as const,
  eligibility: (filters: EligibilityFilters) =>
    [...replenishmentKeys.all, 'eligibility', filters] as const,
  runs: (filters: RunHistoryFilters) =>
    [...replenishmentKeys.all, 'runs', filters] as const,
  runDetail: (code: string | null, filters: RunDetailFilters) =>
    [...replenishmentKeys.all, 'run-detail', code ?? '', filters] as const,
}

export function useEligibility(filters: EligibilityFilters) {
  return useQuery({
    queryKey: replenishmentKeys.eligibility(filters),
    queryFn: ({ signal }) =>
      replenishmentService.getEligibility(filters, signal),
  })
}

export function useReplenishmentRuns(filters: RunHistoryFilters) {
  return useQuery({
    queryKey: replenishmentKeys.runs(filters),
    queryFn: ({ signal }) => replenishmentService.listRuns(filters, signal),
  })
}

export function useRunDetail(code: string | null, filters: RunDetailFilters) {
  return useQuery({
    queryKey: replenishmentKeys.runDetail(code, filters),
    queryFn: ({ signal }) => {
      if (!code) throw new Error('Falta el código de la corrida.')
      return replenishmentService.getRunDetail(code, filters, signal)
    },
    enabled: Boolean(code),
  })
}

export function useCreateReplenishmentRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RunInput) => replenishmentService.createRun(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: replenishmentKeys.all })
    },
  })
}

export function idempotencyKeyForRun() {
  return `replenishment-run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
