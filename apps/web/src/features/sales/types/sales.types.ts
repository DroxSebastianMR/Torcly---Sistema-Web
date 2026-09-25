export type SaleStatus = 'DRAFT' | 'CONFIRMED'
export type SaleStatusFilter = 'all' | SaleStatus
export type SaleLineType = 'PRODUCT' | 'SERVICE'

export interface SaleCustomerRef {
  id: string
  documentNumber: string
  name: string
}

export interface SaleLine {
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

export interface SaleDetail extends SaleSummary {
  lines: SaleLine[]
}

export type SaleLineInput =
  | { type: 'PRODUCT'; productId: string; quantity: number }
  | { type: 'SERVICE'; serviceId: string }

export interface SaleInput {
  customerId: string | null
  lines: SaleLineInput[]
}

export interface SaleFilters {
  search: string
  status: SaleStatusFilter
  page: number
  pageSize: number
}

export interface SalesResponse {
  data: SaleSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface DataResponse<T> {
  data: T
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
