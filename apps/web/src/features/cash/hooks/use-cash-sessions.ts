import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { cashSessionsService } from '../services/cash-sessions.service'
import type {
  CashSessionCloseInput,
  CashSessionFilters,
  CashSessionOpenInput,
} from '../types/cash-session.types'

export const cashSessionKeys = {
  all: ['cash-sessions'] as const,
  current: () => [...cashSessionKeys.all, 'current'] as const,
  list: (filters: CashSessionFilters) =>
    [...cashSessionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...cashSessionKeys.all, 'detail', id] as const,
}

export function useCurrentCashSession() {
  return useQuery({
    queryKey: cashSessionKeys.current(),
    queryFn: ({ signal }) => cashSessionsService.current(signal),
    select: (response) => response.data,
  })
}

export function useCashSessions(filters: CashSessionFilters) {
  return useQuery({
    queryKey: cashSessionKeys.list(filters),
    queryFn: ({ signal }) => cashSessionsService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useCashSession(id: string) {
  return useQuery({
    queryKey: cashSessionKeys.detail(id),
    queryFn: ({ signal }) => cashSessionsService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useCashSessionMutations() {
  const queryClient = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: cashSessionKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['payments'] }),
    ])
  }

  return {
    open: useMutation({
      mutationFn: (input: CashSessionOpenInput) =>
        cashSessionsService.open(input),
      onMutate: () => ({ toastId: startActionToast('Abriendo caja…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    close: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: CashSessionCloseInput
      }) => cashSessionsService.close(id, input),
      onMutate: () => ({ toastId: startActionToast('Cerrando caja…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
