import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { productsService } from '../services/products.service'
import type { ProductFilters, ProductInput } from '../types/products.types'

const CATALOG_STALE_TIME = 5 * 60 * 1000

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

export function useProductOptions(enabled = true) {
  return useQuery({
    queryKey: productKeys.options(),
    queryFn: ({ signal }) => productsService.options(signal),
    enabled,
    select: (response) => response.data,
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useProductCatalog(enabled: boolean) {
  return useQuery({
    queryKey: productKeys.catalog(),
    queryFn: ({ signal }) => productsService.catalog(signal),
    enabled,
    select: (response) => response.data,
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useProductMutations() {
  const queryClient = useQueryClient()
  const refreshProductLists = () => {
    void queryClient.invalidateQueries({
      queryKey: [...productKeys.all, 'list'],
    })
  }

  return {
    create: useMutation({
      mutationFn: (input: ProductInput) => productsService.create(input),
      onMutate: () => ({ toastId: startActionToast('Registrando producto…') }),
      onSuccess: refreshProductLists,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
        productsService.update(id, input),
      onMutate: () => ({ toastId: startActionToast('Actualizando producto…') }),
      onSuccess: refreshProductLists,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    status: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateStatus(id, active),
      onMutate: ({ active }) => ({
        toastId: startActionToast(
          active ? 'Activando producto…' : 'Desactivando producto…',
        ),
      }),
      onSuccess: refreshProductLists,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
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
      onMutate: () => ({ toastId: startActionToast('Agregando categoría…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    brand: useMutation({
      mutationFn: (name: string) => productsService.createBrand(name),
      onMutate: () => ({ toastId: startActionToast('Agregando marca…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    unit: useMutation({
      mutationFn: ({ name, symbol }: { name: string; symbol: string }) =>
        productsService.createUnit(name, symbol),
      onMutate: () => ({ toastId: startActionToast('Agregando unidad…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        productsService.updateCategory(id, name),
      onMutate: () => ({
        toastId: startActionToast('Actualizando categoría…'),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    updateBrand: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        productsService.updateBrand(id, name),
      onMutate: () => ({ toastId: startActionToast('Actualizando marca…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
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
      onMutate: () => ({ toastId: startActionToast('Actualizando unidad…') }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    updateCategoryStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateCategoryStatus(id, active),
      onMutate: ({ active }) => ({
        toastId: startActionToast(
          active ? 'Activando categoría…' : 'Desactivando categoría…',
        ),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    updateBrandStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateBrandStatus(id, active),
      onMutate: ({ active }) => ({
        toastId: startActionToast(
          active ? 'Activando marca…' : 'Desactivando marca…',
        ),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    updateUnitStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        productsService.updateUnitStatus(id, active),
      onMutate: ({ active }) => ({
        toastId: startActionToast(
          active ? 'Activando unidad…' : 'Desactivando unidad…',
        ),
      }),
      onSuccess: refresh,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
