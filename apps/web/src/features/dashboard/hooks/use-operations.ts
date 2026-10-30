import { useQuery } from '@tanstack/react-query'
import { operationsService } from '../services/operations.service'
import type { OperationalSection, Period } from '../types/operations.types'
export const useOperationsSummary = (period: Period) =>
  useQuery({
    queryKey: ['operations', 'summary', period],
    queryFn: ({ signal }) => operationsService.summary(period, signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
export const useOperationsAttention = (
  section: OperationalSection,
  period: Period,
  enabled = true,
) =>
  useQuery({
    queryKey: ['operations', 'attention', section, period],
    queryFn: ({ signal }) =>
      operationsService.attention(section, period, signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled,
  })
