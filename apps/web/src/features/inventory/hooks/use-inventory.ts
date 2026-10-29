import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { inventoryService } from '../services/inventory.service'
import type {
  InventoryFilters,
  MovementFilters,
  MovementFormKind,
  MovementInput,
} from '../types/inventory.types'

const INVENTORY_OPTIONS_STALE_TIME = 5 * 60 * 1000

export const inventoryKeys = {
  all: ['inventory'] as const,
  existence: (filters: InventoryFilters) =>
    [...inventoryKeys.all, 'existence', filters] as const,
  productOptions: () => [...inventoryKeys.all, 'product-options'] as const,
  movements: (filters: MovementFilters) =>
    [...inventoryKeys.all, 'movements', filters] as const,
}

export function useExistence(filters: InventoryFilters, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.existence(filters),
    queryFn: ({ signal }) => inventoryService.listExistence(filters, signal),
    enabled,
  })
}

export function useInventoryProductOptions(enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.productOptions(),
    queryFn: ({ signal }) =>
      inventoryService.listExistence(
        { search: '', page: 1, pageSize: 100 },
        signal,
      ),
    select: (response) => response.data,
    enabled,
    staleTime: INVENTORY_OPTIONS_STALE_TIME,
  })
}

export function useMovements(filters: MovementFilters, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.movements(filters),
    queryFn: ({ signal }) => inventoryService.listMovements(filters, signal),
    enabled,
  })
}

export function useMovementMutations() {
  const queryClient = useQueryClient()
  const removeEntry = () => {
    void queryClient.invalidateQueries({
      queryKey: [...inventoryKeys.all, 'existence'],
    })
    void queryClient.invalidateQueries({
      queryKey: [...inventoryKeys.all, 'movements'],
    })
    void queryClient.invalidateQueries({
      queryKey: inventoryKeys.productOptions(),
      refetchType: 'none',
    })
  }

  return {
    initial: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerInitial(input),
      onMutate: () => ({
        toastId: startActionToast('Registrando stock inicial…'),
      }),
      onSuccess: removeEntry,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    entry: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerEntry(input),
      onMutate: () => ({ toastId: startActionToast('Registrando entrada…') }),
      onSuccess: removeEntry,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    exit: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerExit(input),
      onMutate: () => ({ toastId: startActionToast('Registrando salida…') }),
      onSuccess: removeEntry,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    adjustment: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerAdjustment(input),
      onMutate: () => ({ toastId: startActionToast('Registrando ajuste…') }),
      onSuccess: removeEntry,
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}

export const movementKindLabel: Record<MovementFormKind, string> = {
  INITIAL: 'Stock inicial',
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT: 'Ajuste de inventario',
}

export function idempotencyKeyFor(kind: MovementFormKind) {
  return `${kind.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
