export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED'
export type PurchaseStatusFilter = 'all' | PurchaseStatus

export interface SupplierFilters {
  search?: string
  active?: 'true' | 'false' | 'all'
  page: number
  pageSize: number
}

export interface SupplierInput {
  legalName: string
  documentNumber: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
}

export interface SupplierSummary {
  id: string
  legalName: string
  documentNumber: string
  contactName: string | null
  phone: string | null
  email: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PurchaseFilters {
  supplierId?: string
  status: PurchaseStatusFilter
  from?: string
  to?: string
  page: number
  pageSize: number
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

export interface PurchaseLineResponse {
  id: string
  productId: string
  productCode: string
  productName: string
  unitLabel: string | null
  quantity: number
  unitCost: number
  subtotal: number
}

export interface PurchaseSupplierRef {
  id: string
  legalName: string
  documentNumber: string
}

export interface PurchaseSummary {
  id: string
  code: string
  supplier: PurchaseSupplierRef
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
  lines: PurchaseLineResponse[]
  notes: string | null
}
