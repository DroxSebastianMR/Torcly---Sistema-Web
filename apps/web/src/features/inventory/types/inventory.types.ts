export type MovementType =
  | 'INITIAL'
  | 'ENTRY'
  | 'EXIT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'

export type MovementFormKind = 'INITIAL' | 'ENTRY' | 'EXIT' | 'ADJUSTMENT'

export interface ProductUnitRef {
  name: string
  symbol: string
}

export interface InventoryProductRef {
  id: string
  code: string
  name: string
  unit: ProductUnitRef
}

export interface ExistenceItem {
  productId: string
  code: string
  name: string
  unit: ProductUnitRef
  active: boolean
  stock: number
  minimumStock: number
  lowStock: boolean
  lastMovementAt: string | null
}

export interface InventoryMovement {
  id: string
  productId: string
  product: InventoryProductRef
  type: MovementType
  quantity: number
  notes: string | null
  performedBy: string
  occurredAt: string
  referenceType: string | null
  referenceId: string | null
}

export interface InventoryFilters {
  search: string
  page: number
  pageSize: number
}

export interface MovementFilters {
  productId: string
  type: MovementType | ''
  from: string
  to: string
  page: number
  pageSize: number
}

export interface MovementInput {
  productId: string
  quantity: number
  idempotencyKey: string
  notes?: string
  referenceType?: string
  referenceId?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type ExistenceResponse = PaginatedResponse<ExistenceItem>
export type MovementsResponse = PaginatedResponse<InventoryMovement>

export interface DataResponse<T> {
  data: T
}
