import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  WorkOrderBudgetInput,
  WorkOrderCatalog,
  WorkOrderDecisionInput,
  WorkOrderDetail,
  WorkOrderFilters,
  WorkOrderTechnician,
  WorkOrdersResponse,
} from '../types/work-orders.types'

function buildQuery(filters: WorkOrderFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.technicianId) query.set('technicianId', filters.technicianId)
  return query.toString()
}

export const workOrdersService = {
  list(filters: WorkOrderFilters, signal?: AbortSignal) {
    return api.get<WorkOrdersResponse>(
      `${endpoints.workOrders.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.detail(id),
      signal,
    )
  },
  catalog(signal?: AbortSignal) {
    return api.get<DataResponse<WorkOrderCatalog>>(
      endpoints.workOrders.catalog,
      signal,
    )
  },
  technicians(signal?: AbortSignal) {
    return api.get<DataResponse<WorkOrderTechnician[]>>(
      endpoints.workOrders.technicians,
      signal,
    )
  },
  createFromAppointment(appointmentId: string) {
    return api.post<DataResponse<WorkOrderDetail>>(endpoints.workOrders.root, {
      appointmentId,
    })
  },
  updateDiagnosis(id: string, diagnosis: string) {
    return api.put<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.diagnosis(id),
      { diagnosis },
    )
  },
  saveBudget(id: string, input: WorkOrderBudgetInput) {
    return api.put<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.budget(id),
      input,
    )
  },
  sendBudget(id: string) {
    return api.post<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.budgetSend(id),
    )
  },
  decide(id: string, input: WorkOrderDecisionInput) {
    return api.post<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.decision(id),
      input,
    )
  },
  assignTechnician(id: string, technicianId: string | null) {
    return api.put<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.technician(id),
      { technicianId },
    )
  },
}
