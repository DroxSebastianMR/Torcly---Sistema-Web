import type { MovementType } from '../inventory/inventory.types.js'
import type {
  AppointmentStatus,
  PaymentCollectionStatus,
  WorkOrderStatus,
} from '../operations/operations.types.js'

export const REPORT_BLOCKS = [
  'sales',
  'payments',
  'inventory',
  'services',
  'workshop',
] as const

export type ReportBlock = (typeof REPORT_BLOCKS)[number]

export const REPORT_GRANULARITIES = ['day', 'week', 'month'] as const

export type ReportGranularity = (typeof REPORT_GRANULARITIES)[number]

export const MOVEMENT_TYPES: readonly MovementType[] = [
  'INITIAL',
  'ENTRY',
  'EXIT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
]

export interface ReportPeriod {
  from: string
  to: string
}

export interface ReportDescriptor {
  block: ReportBlock
  label: string
  source: string
  periodField: string
  criteria: string
  trendMeasure: string
  permissions: string[]
}

export interface ReportTrendPoint {
  bucket: string
  label: string
  count: number
  amount: number
}

export interface SalesReportData {
  block: 'sales'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: ReportGranularity
  metrics: {
    count: number
    amount: number
    averageTicket: number
  }
  trend: ReportTrendPoint[]
  composition: Array<{
    type: 'PRODUCT' | 'SERVICE'
    code: string
    name: string
    quantity: number
    amount: number
  }>
}

export interface PaymentsReportData {
  block: 'payments'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: ReportGranularity
  metrics: {
    grossCollected: number
    compensated: number
    netCollected: number
    paymentCount: number
    pendingCount: number
    pendingAmount: number
    byStatus: Record<PaymentCollectionStatus, { count: number; amount: number }>
  }
  trend: ReportTrendPoint[]
}

export interface InventoryReportData {
  block: 'inventory'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: ReportGranularity
  metrics: {
    movementCount: number
    netQuantity: number
    byType: Record<MovementType, number>
    lowStockCount: number
  }
  trend: ReportTrendPoint[]
  lowStock: Array<{
    code: string
    name: string
    stock: number
    minimumStock: number
    unitLabel: string
  }>
}

export interface ServicesReportData {
  block: 'services'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: ReportGranularity
  metrics: {
    serviceCount: number
    unitsSold: number
    amount: number
    averagePerUnit: number
  }
  trend: ReportTrendPoint[]
  top: Array<{
    code: string
    name: string
    quantity: number
    amount: number
  }>
}

export interface WorkshopReportData {
  block: 'workshop'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: ReportGranularity
  metrics: {
    workOrderCount: number
    workOrdersByStatus: Record<WorkOrderStatus, number>
    deliveredCount: number
    averageDeliveryHours: number | null
    appointmentCount: number
    appointmentsByStatus: Record<AppointmentStatus, number>
  }
  trend: ReportTrendPoint[]
}

export type ReportBlockData =
  | SalesReportData
  | PaymentsReportData
  | InventoryReportData
  | ServicesReportData
  | WorkshopReportData

export interface ReportSummary {
  generatedAt: string
  period: ReportPeriod
  blocks: Partial<Record<ReportBlock, ReportDescriptor>>
}
