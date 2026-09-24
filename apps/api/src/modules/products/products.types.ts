export interface ProductCatalogOption {
  id: string
  name: string
  symbol?: string
}

export interface ProductInput {
  code: string
  barcode?: string | null
  name: string
  description?: string | null
  categoryId: string
  brandId?: string | null
  unitId: string
  salePrice: number
  minimumStock: number
}

export interface ProductFilters {
  search?: string
  categoryId?: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface ProductResponse extends ProductInput {
  id: string
  stock: number
  lowStock: boolean
  active: boolean
  category: ProductCatalogOption
  brand: ProductCatalogOption | null
  unit: ProductCatalogOption & { symbol: string }
  createdAt: string
  updatedAt: string
}
