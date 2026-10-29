export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED'
export type PurchaseStatusFilter = 'all' | PurchaseStatus

export interface SupplierRef {
  id: string
  legalName: string
  documentNumber: string
}

export interface SupplierSummary extends SupplierRef {
  contactName: string | null
  phone: string | null
  email: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplierInput {
  legalName: string
  documentNumber: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
}

export interface SupplierFilters {
  search: string
  active: 'true' | 'false' | 'all'
  page: number
  pageSize: number
}

export interface PurchaseLine {
  id: string
  productId: string
  productCode: string
  productName: string
  unitLabel: string | null
  quantity: number
  unitCost: number
  subtotal: number
}

export interface PurchaseSummary {
  id: string
  code: string
  supplier: SupplierRef
  status: PurchaseStatus
  externalRef: string | null
  purchaseDate: string
  total: number
  lineCount: number
  performedBy: string
  receivedBy: string | null
  receivedAt: string | null
  cancelledBy: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PurchaseDetail extends PurchaseSummary {
  lines: PurchaseLine[]
  notes: string | null
}

export interface PurchaseLineInput {
  productId: string
  quantity: number
  unitCost: number
}

export interface PurchaseInput {
  supplierId: string
  purchaseDate: string
  externalRef?: string | null
  notes?: string | null
  lines: PurchaseLineInput[]
}

export interface PurchaseFilters {
  supplierId?: string
  status: PurchaseStatusFilter
  from?: string
  to?: string
  page: number
  pageSize: number
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

export type SuppliersResponse = PaginatedResponse<SupplierSummary>
export type PurchasesResponse = PaginatedResponse<PurchaseSummary>
export type DataResponse<T> = { data: T }
