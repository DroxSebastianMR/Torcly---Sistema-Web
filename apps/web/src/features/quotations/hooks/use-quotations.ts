import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { quotationsService } from '../services/quotations.service'
import type {
  QuotationCreateInput,
  QuotationConversionInput,
  QuotationFilters,
  QuotationUpdateInput,
} from '../types/quotations.types'

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (filters: QuotationFilters) =>
    [...quotationKeys.all, 'list', filters] as const,
  detail: (id: string) => [...quotationKeys.all, 'detail', id] as const,
}

export function useQuotations(filters: QuotationFilters) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: ({ signal }) => quotationsService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: ({ signal }) => quotationsService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useQuotationMutations() {
  const queryClient = useQueryClient()
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: quotationKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: QuotationCreateInput) =>
        quotationsService.create(input),
      onMutate: () => ({
        toastId: startActionToast('Guardando presupuesto…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: QuotationUpdateInput
      }) => quotationsService.update(id, input),
      onMutate: () => ({
        toastId: startActionToast('Actualizando presupuesto…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    convertToOrder: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: QuotationConversionInput
      }) => quotationsService.convertToOrder(id, input),
      onMutate: () => ({
        toastId: startActionToast('Convirtiendo a orden de taller…'),
      }),
      onSuccess: async () => {
        await refresh()
        await queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      },
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
