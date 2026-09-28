import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../services/products.service'
import type { ProductFilters, ProductInput } from '../types/products.types'

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.all, 'list', filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  options: () => [...productKeys.all, 'options'] as const,
  catalog: () => [...productKeys.all, 'catalog'] as const,
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }) => productsService.list(filters, signal),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => productsService.get(id, signal),
    enabled: Boolean(id),
    select: (response) => response.data,
  })
}

export function useProductOptions() {
  return useQuery({
    queryKey: productKeys.options(),
    queryFn: ({ signal }) => productsService.options(signal),
    select: (response) => response.data,
  })
}

export function useProductCatalog(enabled: boolean) {
  return useQuery({
    queryKey: productKeys.catalog(),
    queryFn: ({ signal }) => productsService.catalog(signal),
    enabled,
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
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.options() }),
      queryClient.invalidateQueries({ queryKey: productKeys.catalog() }),
    ])
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
    updateCategory: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        productsService.updateCategory(id, name),
      onSuccess: refresh,
    }),
    updateBrand: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        productsService.updateBrand(id, name),
      onSuccess: refresh,
    }),
    updateUnit: useMutation({
      mutationFn: ({
        id,
        name,
        symbol,
      }: {
        id: string
        name: string
        symbol: string
      }) => productsService.updateUnit(id, name, symbol),
      onSuccess: refresh,
    }),
    updateCategoryStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateCategoryStatus(id, active),
      onSuccess: refresh,
    }),
    updateBrandStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateBrandStatus(id, active),
      onSuccess: refresh,
    }),
    updateUnitStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateUnitStatus(id, active),
      onSuccess: refresh,
    }),
  }
}
