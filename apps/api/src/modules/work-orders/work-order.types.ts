export type WorkOrderStatus =
  | 'RECEPCIONADA'
  | 'EN_DIAGNOSTICO'
  | 'PENDIENTE_APROBACION'
  | 'APROBADA'
  | 'RECHAZADA'
export type WorkOrderStatusFilter = 'all' | WorkOrderStatus
export type WorkOrderLineType = 'PRODUCT' | 'SERVICE'

export interface WorkOrderFilters {
  search?: string
  status: WorkOrderStatusFilter
  technicianId?: string
  page: number
  pageSize: number
}

export interface WorkOrderLineInput {
  type: WorkOrderLineType
  productId?: string
  serviceId?: string
  quantity?: number
}

export interface WorkOrderBudgetInput {
  lines: WorkOrderLineInput[]
}

export interface WorkOrderDecisionInput {
  decision: 'APPROVED' | 'REJECTED'
  notes?: string
}

export interface WorkOrderTechnicianInput {
  technicianId: string | null
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

export interface WorkOrderLineResponse {
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
  createdAt: string
  updatedAt: string
}

export interface WorkOrderDetail extends WorkOrderSummary {
  diagnosis: string | null
  lines: WorkOrderLineResponse[]
}

export interface WorkOrderStats {
  total: number
  recepcionadas: number
  enDiagnostico: number
  pendientesAprobacion: number
  aprobadas: number
  rechazadas: number
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
