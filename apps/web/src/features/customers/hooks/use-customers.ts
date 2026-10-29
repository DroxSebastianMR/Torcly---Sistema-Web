import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { customersService } from '../services/customers.service'
import type {
  CustomerCreateInput,
  CustomerFilters,
  CustomerUpdateInput,
} from '../types/customers.types'

export const customerKeys = {
  all: ['customers'] as const,
  list: (filters: CustomerFilters) =>
    [...customerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
}

export function useCustomers(
  filters: CustomerFilters,
  enabled = true,
  staleTime = 15_000,
) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: ({ signal }) => customersService.list(filters, signal),
    placeholderData: (previous) => previous,
    enabled,
    staleTime,
  })
}

export function useCustomer(id: string, enabled = Boolean(id)) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: ({ signal }) => customersService.get(id, signal),
    select: (response) => response.data,
    enabled,
  })
}

export function useCustomerMutations() {
  const queryClient = useQueryClient()
  const refreshCustomers = () => {
    void queryClient.invalidateQueries({
      queryKey: [...customerKeys.all, 'list'],
    })
    void queryClient.invalidateQueries({
      queryKey: [...customerKeys.all, 'detail'],
      refetchType: 'none',
    })
  }

  return {
    create: useMutation({
      mutationFn: (input: CustomerCreateInput) =>
        customersService.create(input),
      onMutate: () => ({ toastId: startActionToast('Registrando cliente…') }),
      onSuccess: refreshCustomers,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: CustomerUpdateInput }) =>
        customersService.update(id, input),
      onMutate: () => ({ toastId: startActionToast('Actualizando cliente…') }),
      onSuccess: refreshCustomers,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
