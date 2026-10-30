import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentKeys } from '@/features/cash/hooks/use-payments'
import { paymentsService } from '@/features/cash/services/payments.service'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { salesService } from '../services/sales.service'
import type {
  SaleCancellationInput,
  SaleFilters,
  SaleInput,
} from '../types/sales.types'

const cashLandingFilters = {
  search: '',
  status: 'all',
  method: 'all',
  from: null,
  to: null,
  page: 1,
  pageSize: 10,
} as const

export const saleKeys = {
  all: ['sales'] as const,
  list: (filters: SaleFilters) => [...saleKeys.all, 'list', filters] as const,
  detail: (id: string) => [...saleKeys.all, 'detail', id] as const,
  catalog: () => [...saleKeys.all, 'catalog'] as const,
}

export function useSales(filters: SaleFilters) {
  return useQuery({
    queryKey: saleKeys.list(filters),
    queryFn: ({ signal }) => salesService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: ({ signal }) => salesService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useSaleCatalog(enabled = true) {
  return useQuery({
    queryKey: saleKeys.catalog(),
    queryFn: ({ signal }) => salesService.catalog(signal),
    select: (response) => response.data,
    enabled,
  })
}

export function useSaleMutations() {
  const queryClient = useQueryClient()
  const refreshSales = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: saleKeys.all }),
      queryClient.invalidateQueries({ queryKey: paymentKeys.all }),
    ])

    await queryClient.prefetchQuery({
      queryKey: paymentKeys.list(cashLandingFilters),
      queryFn: () => paymentsService.list(cashLandingFilters),
    })
  }

  return {
    create: useMutation({
      mutationFn: (input: SaleInput) => salesService.create(input),
      onMutate: () => ({ toastId: startActionToast('Guardando venta…') }),
      onSuccess: refreshSales,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SaleInput }) =>
        salesService.update(id, input),
      onMutate: () => ({ toastId: startActionToast('Actualizando venta…') }),
      onSuccess: refreshSales,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    createConfirmed: useMutation({
      mutationFn: (input: SaleInput) => salesService.createConfirmed(input),
      onMutate: () => ({ toastId: startActionToast('Confirmando venta…') }),
      onSuccess: refreshSales,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    confirm: useMutation({
      mutationFn: (id: string) => salesService.confirm(id),
      onMutate: () => ({ toastId: startActionToast('Confirmando venta…') }),
      onSuccess: refreshSales,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    cancel: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: SaleCancellationInput
      }) => salesService.cancel(id, input),
      onMutate: () => ({ toastId: startActionToast('Anulando venta…') }),
      onSuccess: refreshSales,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
