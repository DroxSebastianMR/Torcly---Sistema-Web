import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  ExistenceResponse,
  InventoryFilters,
  InventoryMovement,
  MovementFilters,
  MovementInput,
  MovementsResponse,
  MovementType,
} from '../types/inventory.types'

function buildInventoryQuery(filters: InventoryFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

function buildMovementQuery(filters: MovementFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.productId) query.set('productId', filters.productId)
  if (filters.type) query.set('type', filters.type)
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  return query.toString()
}

export const inventoryService = {
  listExistence(filters: InventoryFilters, signal?: AbortSignal) {
    return api.get<ExistenceResponse>(
      `${endpoints.inventory.existence}?${buildInventoryQuery(filters)}`,
      signal,
    )
  },
  listMovements(filters: MovementFilters, signal?: AbortSignal) {
    return api.get<MovementsResponse>(
      `${endpoints.inventory.movements}?${buildMovementQuery(filters)}`,
      signal,
    )
  },
  registerInitial(input: MovementInput) {
    return api.post<DataResponse<InventoryMovement>>(
      endpoints.inventory.initialStock,
      input,
    )
  },
  registerEntry(input: MovementInput) {
    return api.post<DataResponse<InventoryMovement>>(
      endpoints.inventory.entries,
      input,
    )
  },
  registerExit(input: MovementInput) {
    return api.post<DataResponse<InventoryMovement>>(
      endpoints.inventory.exits,
      input,
    )
  },
  registerAdjustment(input: MovementInput) {
    return api.post<DataResponse<InventoryMovement>>(
      endpoints.inventory.adjustments,
      input,
    )
  },
}

export function movementTypeOptions(): Array<{
  value: MovementType | ''
  label: string
}> {
  return [
    { value: '', label: 'Todos los tipos' },
    { value: 'INITIAL', label: 'Stock inicial' },
    { value: 'ENTRY', label: 'Entradas' },
    { value: 'EXIT', label: 'Salidas' },
    { value: 'ADJUSTMENT_IN', label: 'Ajustes de ingreso' },
    { value: 'ADJUSTMENT_OUT', label: 'Ajustes de egreso' },
  ]
}
