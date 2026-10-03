import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  WorkOrderActivity,
  WorkOrderActivityInput,
  WorkOrderBudgetInput,
  WorkOrderCatalog,
  WorkOrderConsumptionInput,
  WorkOrderConsumptionMutationResult,
  WorkOrderDecisionInput,
  WorkOrderDeliveryInput,
  WorkOrderDetail,
  WorkOrderExecution,
  WorkOrderFilters,
  WorkOrderReturnInput,
  WorkOrderTechnician,
  WorkOrderVehicleHistoryResponse,
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
  startExecution(id: string) {
    return api.post<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.executionStart(id),
      {},
    )
  },
  execution(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<WorkOrderExecution>>(
      endpoints.workOrders.execution(id),
      signal,
    )
  },
  createActivity(id: string, input: WorkOrderActivityInput) {
    return api.post<DataResponse<WorkOrderActivity>>(
      endpoints.workOrders.activities(id),
      input,
    )
  },
  completeActivity(id: string, activityId: string) {
    return api.post<DataResponse<WorkOrderActivity>>(
      endpoints.workOrders.activityComplete(id, activityId),
      {},
    )
  },
  consume(id: string, input: WorkOrderConsumptionInput) {
    return api.post<DataResponse<WorkOrderConsumptionMutationResult>>(
      endpoints.workOrders.consumptions(id),
      input,
    )
  },
  returnProducts(id: string, input: WorkOrderReturnInput) {
    return api.post<DataResponse<WorkOrderConsumptionMutationResult>>(
      endpoints.workOrders.returns(id),
      input,
    )
  },
  finalize(id: string) {
    return api.post<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.finalize(id),
      {},
    )
  },
  deliver(id: string, input: WorkOrderDeliveryInput) {
    return api.post<DataResponse<WorkOrderDetail>>(
      endpoints.workOrders.delivery(id),
      input,
    )
  },
  vehicleHistory(
    vehicleId: string,
    page: number,
    pageSize: number,
    signal?: AbortSignal,
  ) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    return api.get<WorkOrderVehicleHistoryResponse>(
      `${endpoints.workOrders.vehicleHistory(vehicleId)}?${query.toString()}`,
      signal,
    )
  },
}
