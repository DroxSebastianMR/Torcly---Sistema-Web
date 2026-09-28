import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '../services/inventory.service'
import type {
  InventoryFilters,
  MovementFilters,
  MovementFormKind,
  MovementInput,
} from '../types/inventory.types'

export const inventoryKeys = {
  all: ['inventory'] as const,
  existence: (filters: InventoryFilters) =>
    [...inventoryKeys.all, 'existence', filters] as const,
  productOptions: () => [...inventoryKeys.all, 'product-options'] as const,
  movements: (filters: MovementFilters) =>
    [...inventoryKeys.all, 'movements', filters] as const,
}

export function useExistence(filters: InventoryFilters) {
  return useQuery({
    queryKey: inventoryKeys.existence(filters),
    queryFn: ({ signal }) => inventoryService.listExistence(filters, signal),
  })
}

export function useInventoryProductOptions() {
  return useQuery({
    queryKey: inventoryKeys.productOptions(),
    queryFn: ({ signal }) =>
      inventoryService.listExistence(
        { search: '', page: 1, pageSize: 100 },
        signal,
      ),
    select: (response) => response.data,
  })
}

export function useMovements(filters: MovementFilters) {
  return useQuery({
    queryKey: inventoryKeys.movements(filters),
    queryFn: ({ signal }) => inventoryService.listMovements(filters, signal),
  })
}

export function useMovementMutations() {
  const queryClient = useQueryClient()
  const removeEntry = () => {
    void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
  }

  return {
    initial: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerInitial(input),
      onSuccess: removeEntry,
    }),
    entry: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerEntry(input),
      onSuccess: removeEntry,
    }),
    exit: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerExit(input),
      onSuccess: removeEntry,
    }),
    adjustment: useMutation({
      mutationFn: (input: MovementInput) =>
        inventoryService.registerAdjustment(input),
      onSuccess: removeEntry,
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
