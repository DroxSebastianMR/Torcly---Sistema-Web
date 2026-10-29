export type MovementType =
  | 'INITIAL'
  | 'ENTRY'
  | 'EXIT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'

export interface ExistenceFilters {
  search?: string
  page: number
  pageSize: number
}

export interface InventoryMovementFilters {
  productId?: string
  type?: MovementType
  from?: string
  to?: string
  page: number
  pageSize: number
}

export interface MovementInput {
  productId: string
  quantity: number
  idempotencyKey: string
  notes?: string | null
  occurredAt?: Date | string
  referenceType?: string | null
  referenceId?: string | null
}

export interface MovementProductRef {
  id: string
  code: string
  name: string
  unit: { name: string; symbol: string }
}

export interface ExistenceItem {
  productId: string
  code: string
  name: string
  unit: { name: string; symbol: string }
  active: boolean
  stock: number
  minimumStock: number
  lowStock: boolean
  lastMovementAt: string | null
}

export interface InventoryMovementResponse {
  id: string
  productId: string
  product: MovementProductRef
  type: MovementType
  quantity: number
  notes: string | null
  performedBy: string
  occurredAt: string
  referenceType: string | null
  referenceId: string | null
}
