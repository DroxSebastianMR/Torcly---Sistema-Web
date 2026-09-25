export type SaleStatus = 'DRAFT' | 'CONFIRMED'
export type SaleStatusFilter = 'all' | SaleStatus
export type SaleLineType = 'PRODUCT' | 'SERVICE'

export interface SaleFilters {
  search?: string
  status: SaleStatusFilter
  page: number
  pageSize: number
}

export interface SaleLineInput {
  type: SaleLineType
  productId?: string
  serviceId?: string
  quantity?: number
}

export interface SaleInput {
  customerId?: string | null
  lines: SaleLineInput[]
}

export interface SaleCustomerRef {
  id: string
  documentNumber: string
  name: string
}

export interface SaleSummary {
  id: string
  code: string
  customer: SaleCustomerRef | null
  status: SaleStatus
  subtotal: number
  total: number
  lineCount: number
  performedBy: string
  confirmedBy: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SaleLineResponse {
  id: string
  type: SaleLineType
  productId: string | null
  serviceId: string | null
  name: string
  code: string
  unitLabel: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface SaleDetail extends SaleSummary {
  lines: SaleLineResponse[]
}

export interface SaleCatalogProduct {
  productId: string
  code: string
  name: string
  unit: { name: string; symbol: string }
  active: boolean
  salePrice: number
  stock: number
  lowStock: boolean
}

export interface SaleCatalogService {
  id: string
  code: string
  name: string
  price: number
}

export interface SaleCatalog {
  products: SaleCatalogProduct[]
  services: SaleCatalogService[]
}
