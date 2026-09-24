import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  CatalogOption,
  Product,
  ProductFilters,
  ProductInput,
  ProductOptions,
  ProductsResponse,
} from '../types/products.types'

interface DataResponse<T> {
  data: T
}

function buildQuery(filters: ProductFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.categoryId) query.set('categoryId', filters.categoryId)
  return query.toString()
}

export const productsService = {
  list(filters: ProductFilters, signal?: AbortSignal) {
    return api.get<ProductsResponse>(
      `${endpoints.products.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  options(signal?: AbortSignal) {
    return api.get<DataResponse<ProductOptions>>(
      endpoints.products.options,
      signal,
    )
  },
  create(input: ProductInput) {
    return api.post<DataResponse<Product>>(endpoints.products.root, input)
  },
  update(id: string, input: ProductInput) {
    return api.put<DataResponse<Product>>(endpoints.products.detail(id), input)
  },
  updateStatus(id: string, active: boolean) {
    return api.patch<DataResponse<Product>>(endpoints.products.status(id), {
      active,
    })
  },
  createCategory(name: string) {
    return api.post<DataResponse<CatalogOption>>(
      endpoints.products.categories,
      { name },
    )
  },
  createBrand(name: string) {
    return api.post<DataResponse<CatalogOption>>(endpoints.products.brands, {
      name,
    })
  },
  createUnit(name: string, symbol: string) {
    return api.post<DataResponse<CatalogOption>>(endpoints.products.units, {
      name,
      symbol,
    })
  },
}
