export interface CatalogOption {
  id: string
  name: string
  symbol?: string
}

export interface CatalogItem extends CatalogOption {
  active: boolean
}

export interface ProductInput {
  code: string
  barcode: string | null
  name: string
  description: string | null
  categoryId: string
  brandId: string | null
  unitId: string
  salePrice: number
  minimumStock: number
}

export interface Product extends ProductInput {
  id: string
  stock: number
  lowStock: boolean
  active: boolean
  category: CatalogOption
  brand: CatalogOption | null
  unit: CatalogOption & { symbol: string }
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  search: string
  categoryId: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface ProductOptions {
  categories: CatalogOption[]
  brands: CatalogOption[]
  units: Array<CatalogOption & { symbol: string }>
}

export interface ProductCatalog {
  categories: CatalogItem[]
  brands: CatalogItem[]
  units: Array<CatalogItem & { symbol: string }>
}

export interface ProductsResponse {
  data: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
