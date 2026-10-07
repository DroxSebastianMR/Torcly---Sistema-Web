export const OPERATIONAL_SECTIONS = [
  'appointments',
  'workOrders',
  'sales',
  'payments',
  'inventory',
] as const

export type OperationalSection = (typeof OPERATIONAL_SECTIONS)[number]

export type AppointmentStatus = 'PROGRAMADA' | 'CANCELADA' | 'ATENDIDA'

export const WORK_ORDER_STATUSES = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
  'APROBADA',
  'RECHAZADA',
  'EN_EJECUCION',
  'LISTA_PARA_ENTREGA',
  'ENTREGADA',
] as const

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number]

export type PaymentCollectionStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID'

export interface OperationalPeriod {
  from: string | null
  to: string | null
}

export interface OperationalFilters extends OperationalPeriod {
  page: number
  pageSize: number
}

export interface SectionDescriptor {
  section: OperationalSection
  label: string
  source: string
  periodField: string
  criteria: string
  permissions: string[]
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AppointmentsSectionSummary {
  section: 'appointments'
  total: number
  byStatus: Record<AppointmentStatus, number>
  attentionCount: number
}

export interface WorkOrdersSectionSummary {
  section: 'workOrders'
  total: number
  byStatus: Record<WorkOrderStatus, number>
  attentionCount: number
}

export interface SalesSectionSummary {
  section: 'sales'
  confirmedCount: number
  confirmedAmount: number
}

export interface PaymentsSectionSummary {
  section: 'payments'
  pendingCount: number
  pendingAmount: number
}

export interface InventorySectionSummary {
  section: 'inventory'
  lowStockCount: number
}

export type OperationalSectionSummary =
  | AppointmentsSectionSummary
  | WorkOrdersSectionSummary
  | SalesSectionSummary
  | PaymentsSectionSummary
  | InventorySectionSummary

export type OperationalSectionSummaryMap = Partial<
  Record<OperationalSection, OperationalSectionSummary>
>

export interface OperationalSummary {
  generatedAt: string
  period: OperationalPeriod
  sections: Partial<Record<OperationalSection, OperationalSectionSummary>>
  descriptors: Record<OperationalSection, SectionDescriptor>
}

export interface AppointmentAttentionItem {
  code: string
  date: string
  time: string
  status: AppointmentStatus
  customerName: string
  vehiclePlate: string
}

export interface WorkOrderAttentionItem {
  code: string
  status: WorkOrderStatus
  customerName: string
  vehiclePlate: string
  createdAt: string
}

export interface SaleAttentionItem {
  code: string
  customerName: string | null
  total: number
  confirmedAt: string
}

export interface PaymentAttentionItem {
  code: string
  customerName: string | null
  total: number
  paid: number
  balance: number
  collectionStatus: PaymentCollectionStatus
  confirmedAt: string
}

export interface InventoryAttentionItem {
  code: string
  name: string
  stock: number
  minimumStock: number
  unitLabel: string
}

export type AttentionItem =
  | AppointmentAttentionItem
  | WorkOrderAttentionItem
  | SaleAttentionItem
  | PaymentAttentionItem
  | InventoryAttentionItem

export interface OperationalAttentionResponse {
  section: OperationalSection
  descriptor: SectionDescriptor
  period: OperationalPeriod
  data: AttentionItem[]
  pagination: Pagination
}
