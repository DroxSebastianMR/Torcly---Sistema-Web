import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../services/products.service'
import type { ProductFilters, ProductInput } from '../types/products.types'

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.all, 'list', filters] as const,
  options: () => [...productKeys.all, 'options'] as const,
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }) => productsService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function useProductOptions() {
  return useQuery({
    queryKey: productKeys.options(),
    queryFn: ({ signal }) => productsService.options(signal),
    select: (response) => response.data,
  })
}

export function useProductMutations() {
  const queryClient = useQueryClient()
  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.all })
  }

  return {
    create: useMutation({
      mutationFn: (input: ProductInput) => productsService.create(input),
      onSuccess: refreshProducts,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
        productsService.update(id, input),
      onSuccess: refreshProducts,
    }),
    status: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateStatus(id, active),
      onSuccess: refreshProducts,
    }),
  }
}

export function useCatalogMutations() {
  const queryClient = useQueryClient()
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.options() })
  }

  return {
    category: useMutation({
      mutationFn: (name: string) => productsService.createCategory(name),
      onSuccess: refresh,
    }),
    brand: useMutation({
      mutationFn: (name: string) => productsService.createBrand(name),
      onSuccess: refresh,
    }),
    unit: useMutation({
      mutationFn: ({ name, symbol }: { name: string; symbol: string }) =>
        productsService.createUnit(name, symbol),
      onSuccess: refresh,
    }),
  }
}
