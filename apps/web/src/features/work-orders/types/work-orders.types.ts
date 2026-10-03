export type WorkOrderStatus =
  | 'RECEPCIONADA'
  | 'EN_DIAGNOSTICO'
  | 'PENDIENTE_APROBACION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'EN_EJECUCION'
  | 'LISTA_PARA_ENTREGA'
  | 'ENTREGADA'
export type WorkOrderStatusFilter = 'all' | WorkOrderStatus
export type WorkOrderLineType = 'PRODUCT' | 'SERVICE'
export type WorkOrderActivityStatus = 'PENDIENTE' | 'COMPLETADA'

export interface WorkOrderFilters {
  search: string
  status: WorkOrderStatusFilter
  technicianId: string
  page: number
  pageSize: number
}

export interface WorkOrderCustomerRef {
  id: string
  documentNumber: string
  name: string
}

export interface WorkOrderVehicleRef {
  id: string
  plate: string
  brand: string
  model: string
  year: number
}

export interface WorkOrderLine {
  id: string
  type: WorkOrderLineType
  productId: string | null
  serviceId: string | null
  name: string
  code: string
  unitLabel: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface WorkOrderSummary {
  id: string
  code: string
  appointment: { id: string; code: string }
  customer: WorkOrderCustomerRef
  vehicle: WorkOrderVehicleRef
  status: WorkOrderStatus
  technicianId: string | null
  technician: string | null
  subtotal: number
  total: number
  lineCount: number
  performedBy: string
  diagnosisUpdatedBy: string | null
  diagnosisUpdatedAt: string | null
  budgetSentAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  decisionNotes: string | null
  executionStartedBy: string | null
  executionStartedAt: string | null
  readyForDeliveryAt: string | null
  deliveredBy: string | null
  deliveredAt: string | null
  deliveryNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkOrderDetail extends WorkOrderSummary {
  diagnosis: string | null
  lines: WorkOrderLine[]
}

export interface WorkOrderStats {
  total: number
  recepcionadas: number
  enDiagnostico: number
  pendientesAprobacion: number
  aprobadas: number
  rechazadas: number
  enEjecucion: number
  listasParaEntrega: number
  entregadas: number
}

export interface WorkOrdersResponse {
  data: WorkOrderSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: WorkOrderStats
}

export interface DataResponse<T> {
  data: T
}

export interface WorkOrderCatalogProduct {
  id: string
  code: string
  name: string
  unit: { name: string; symbol: string }
  salePrice: number
}

export interface WorkOrderCatalogService {
  id: string
  code: string
  name: string
  price: number
}

export interface WorkOrderCatalog {
  products: WorkOrderCatalogProduct[]
  services: WorkOrderCatalogService[]
}

export interface WorkOrderTechnician {
  id: string
  displayName: string
}

export type WorkOrderLineInput =
  | { type: 'PRODUCT'; productId: string; quantity: number }
  | { type: 'SERVICE'; serviceId: string }

export interface WorkOrderBudgetInput {
  lines: WorkOrderLineInput[]
}

export interface WorkOrderDecisionInput {
  decision: 'APPROVED' | 'REJECTED'
  notes?: string
}

export interface WorkOrderActivityInput {
  description: string
  occurredAt?: string
}

export interface WorkOrderConsumptionItem {
  lineId: string
  quantity: number
}

export interface WorkOrderConsumptionInput {
  requestId: string
  items: WorkOrderConsumptionItem[]
}

export interface WorkOrderReturnItem {
  lineId: string
  quantity: number
  notes?: string
}

export interface WorkOrderReturnInput {
  requestId: string
  items: WorkOrderReturnItem[]
}

export interface WorkOrderDeliveryInput {
  notes?: string
}

export interface WorkOrderActivity {
  id: string
  status: WorkOrderActivityStatus
  description: string
  performedBy: string
  occurredAt: string
  completedBy: string | null
  completedAt: string | null
  createdAt: string
}

export interface WorkOrderProductLineConsumption {
  lineId: string
  productId: string | null
  name: string
  code: string
  unitLabel: string | null
  budgeted: number
  consumed: number
  returned: number
  netConsumed: number
  pending: number
}

export interface WorkOrderConsumption {
  id: string
  type: 'CONSUMPTION' | 'RETURN'
  workOrderLineId: string
  productId: string | null
  quantity: number
  notes: string | null
  performedBy: string
  occurredAt: string
}

export interface WorkOrderExecution {
  workOrderId: string
  code: string
  status: WorkOrderStatus
  startedBy: string | null
  startedAt: string | null
  readyForDeliveryAt: string | null
  deliveredBy: string | null
  deliveredAt: string | null
  deliveryNotes: string | null
  activities: WorkOrderActivity[]
  productLines: WorkOrderProductLineConsumption[]
  consumptions: WorkOrderConsumption[]
}

export interface WorkOrderVehicleHistoryActivity {
  id: string
  description: string
  status: WorkOrderActivityStatus
  performedBy: string
  occurredAt: string
}

export interface WorkOrderVehicleHistoryProduct {
  lineId: string
  productId: string | null
  name: string
  code: string
  unitLabel: string | null
  quantity: number
}

export interface WorkOrderVehicleHistoryItem {
  id: string
  code: string
  diagnosis: string | null
  technicianId: string | null
  technician: string | null
  performedBy: string
  deliveredBy: string | null
  deliveredAt: string | null
  subtotal: number
  total: number
  activities: WorkOrderVehicleHistoryActivity[]
  products: WorkOrderVehicleHistoryProduct[]
}

export interface WorkOrderVehicleHistoryResponse {
  data: WorkOrderVehicleHistoryItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface WorkOrderConsumptionMutationResult {
  order: WorkOrderDetail
  registrations: WorkOrderConsumption[]
}
