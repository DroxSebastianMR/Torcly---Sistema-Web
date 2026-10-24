import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { purchasesService } from '../services/purchases.service'
import type {
  PurchaseFilters,
  PurchaseInput,
  SupplierFilters,
  SupplierInput,
} from '../types/purchases.types'

export const purchaseKeys = {
  all: ['purchases'] as const,
  list: (filters: PurchaseFilters) =>
    [...purchaseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...purchaseKeys.all, 'detail', id] as const,
  suppliers: ['suppliers'] as const,
  supplierList: (filters: SupplierFilters) =>
    [...purchaseKeys.suppliers, 'list', filters] as const,
  activeSuppliers: () => [...purchaseKeys.suppliers, 'active'] as const,
}

export function usePurchases(filters: PurchaseFilters) {
  return useQuery({
    queryKey: purchaseKeys.list(filters),
    queryFn: ({ signal }) => purchasesService.listPurchases(filters, signal),
    placeholderData: (previous) => previous,
  })
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: purchaseKeys.detail(id),
    queryFn: ({ signal }) => purchasesService.getPurchase(id, signal),
    select: (response) => response.data,
    enabled: Boolean(id),
  })
}

export function useSuppliers(filters: SupplierFilters, enabled = true) {
  return useQuery({
    queryKey: purchaseKeys.supplierList(filters),
    queryFn: ({ signal }) => purchasesService.listSuppliers(filters, signal),
    placeholderData: (previous) => previous,
    enabled,
  })
}

export function useActiveSuppliers(enabled = true) {
  return useQuery({
    queryKey: purchaseKeys.activeSuppliers(),
    queryFn: ({ signal }) => purchasesService.listActiveSuppliers(signal),
    select: (response) => response.data,
    enabled,
    staleTime: 60_000,
  })
}

export function usePurchaseMutations() {
  const queryClient = useQueryClient()

  const refreshPurchases = async () => {
    await queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
  }

  const refreshSuppliers = async () => {
    await queryClient.invalidateQueries({ queryKey: purchaseKeys.suppliers })
  }

  return {
    createPurchase: useMutation({
      mutationFn: (input: PurchaseInput) =>
        purchasesService.createPurchase(input),
      onSuccess: refreshPurchases,
    }),
    updatePurchase: useMutation({
      mutationFn: ({ id, input }: { id: string; input: PurchaseInput }) =>
        purchasesService.updatePurchase(id, input),
      onSuccess: refreshPurchases,
    }),
    receivePurchase: useMutation({
      mutationFn: ({ id, requestId }: { id: string; requestId: string }) =>
        purchasesService.receivePurchase(id, requestId),
      onSuccess: refreshPurchases,
    }),
    cancelPurchase: useMutation({
      mutationFn: (id: string) => purchasesService.cancelPurchase(id),
      onSuccess: refreshPurchases,
    }),
    createSupplier: useMutation({
      mutationFn: (input: SupplierInput) =>
        purchasesService.createSupplier(input),
      onSuccess: refreshSuppliers,
    }),
    updateSupplier: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SupplierInput }) =>
        purchasesService.updateSupplier(id, input),
      onSuccess: refreshSuppliers,
    }),
    toggleSupplierStatus: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        purchasesService.toggleSupplierStatus(id, active),
      onSuccess: refreshSuppliers,
    }),
  }
}
