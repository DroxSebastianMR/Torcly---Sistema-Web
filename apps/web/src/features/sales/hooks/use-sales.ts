import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { salesService } from '../services/sales.service'
import type { SaleFilters, SaleInput } from '../types/sales.types'

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

export function useSaleCatalog() {
  return useQuery({
    queryKey: saleKeys.catalog(),
    queryFn: ({ signal }) => salesService.catalog(signal),
    select: (response) => response.data,
  })
}

export function useSaleMutations() {
  const queryClient = useQueryClient()
  const refreshSales = async () => {
    await queryClient.invalidateQueries({ queryKey: saleKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: SaleInput) => salesService.create(input),
      onSuccess: refreshSales,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SaleInput }) =>
        salesService.update(id, input),
      onSuccess: refreshSales,
    }),
    confirm: useMutation({
      mutationFn: (id: string) => salesService.confirm(id),
      onSuccess: refreshSales,
    }),
  }
}
