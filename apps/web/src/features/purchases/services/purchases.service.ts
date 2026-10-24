import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  PurchaseDetail,
  PurchaseFilters,
  PurchaseInput,
  PurchasesResponse,
  SupplierFilters,
  SupplierInput,
  SupplierRef,
  SupplierSummary,
  SuppliersResponse,
} from '../types/purchases.types'

function buildSupplierQuery(filters: SupplierFilters) {
  const query = new URLSearchParams({
    active: filters.active,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

function buildPurchaseQuery(filters: PurchaseFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.supplierId) query.set('supplierId', filters.supplierId)
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  return query.toString()
}

export const purchasesService = {
  // Suppliers
  listSuppliers(filters: SupplierFilters, signal?: AbortSignal) {
    return api.get<SuppliersResponse>(
      `${endpoints.purchases.suppliers}?${buildSupplierQuery(filters)}`,
      signal,
    )
  },
  listActiveSuppliers(signal?: AbortSignal) {
    return api.get<DataResponse<SupplierRef[]>>(
      endpoints.purchases.activeSuppliers,
      signal,
    )
  },
  getSupplier(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<SupplierSummary>>(
      endpoints.purchases.supplier(id),
      signal,
    )
  },
  createSupplier(input: SupplierInput) {
    return api.post<DataResponse<SupplierSummary>>(
      endpoints.purchases.suppliers,
      input,
    )
  },
  updateSupplier(id: string, input: SupplierInput) {
    return api.put<DataResponse<SupplierSummary>>(
      endpoints.purchases.supplier(id),
      input,
    )
  },
  toggleSupplierStatus(id: string, active: boolean) {
    return api.patch<DataResponse<SupplierSummary>>(
      endpoints.purchases.supplierStatus(id),
      { active },
    )
  },

  // Purchases
  listPurchases(filters: PurchaseFilters, signal?: AbortSignal) {
    return api.get<PurchasesResponse>(
      `${endpoints.purchases.root}?${buildPurchaseQuery(filters)}`,
      signal,
    )
  },
  getPurchase(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<PurchaseDetail>>(
      endpoints.purchases.detail(id),
      signal,
    )
  },
  createPurchase(input: PurchaseInput) {
    return api.post<DataResponse<PurchaseDetail>>(
      endpoints.purchases.root,
      input,
    )
  },
  updatePurchase(id: string, input: PurchaseInput) {
    return api.put<DataResponse<PurchaseDetail>>(
      endpoints.purchases.detail(id),
      input,
    )
  },
  receivePurchase(id: string, requestId: string) {
    return api.post<DataResponse<PurchaseDetail>>(
      endpoints.purchases.receive(id),
      { requestId },
    )
  },
  cancelPurchase(id: string) {
    return api.post<DataResponse<PurchaseDetail>>(
      endpoints.purchases.cancel(id),
    )
  },
}
