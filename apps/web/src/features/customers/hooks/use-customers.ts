import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: ({ signal }) => customersService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: ({ signal }) => customersService.get(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useCustomerMutations() {
  const queryClient = useQueryClient()
  const refreshCustomers = async () => {
    await queryClient.invalidateQueries({ queryKey: customerKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: CustomerCreateInput) =>
        customersService.create(input),
      onSuccess: refreshCustomers,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: CustomerUpdateInput }) =>
        customersService.update(id, input),
      onSuccess: refreshCustomers,
    }),
  }
}
