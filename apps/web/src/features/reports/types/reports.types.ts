export type ReportBlock =
  | 'sales'
  | 'payments'
  | 'inventory'
  | 'services'
  | 'workshop'

export interface Period {
  from: string | null
  to: string | null
}

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

export interface TrendPoint {
  bucket: string
  label: string
  count: number
  amount: number
}

export interface PaymentsTrendPoint extends TrendPoint {
  grossCollected: number
  compensated: number
  netCollected: number
}

export interface InventoryTrendPoint extends TrendPoint {
  initial: number
  entry: number
  exit: number
  adjustmentIn: number
  adjustmentOut: number
}

export interface WorkshopTrendPoint extends TrendPoint {
  ordersCreated: number
  delivered: number
}

export interface SalesBlockData {
  block: 'sales'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: 'day' | 'week' | 'month'
  metrics: {
    count: number
    amount: number
    averageTicket: number
  }
  trend: TrendPoint[]
  composition: Array<{
    type: 'PRODUCT' | 'SERVICE'
    code: string
    name: string
    quantity: number
    amount: number
  }>
}

export interface PaymentsBlockData {
  block: 'payments'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: 'day' | 'week' | 'month'
  metrics: {
    grossCollected: number
    compensated: number
    netCollected: number
    paymentCount: number
    pendingCount: number
    pendingAmount: number
    byStatus: Record<
      'PENDING' | 'PARTIALLY_PAID' | 'PAID',
      { count: number; amount: number }
    >
  }
  trend: PaymentsTrendPoint[]
}

export interface InventoryBlockData {
  block: 'inventory'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: 'day' | 'week' | 'month'
  metrics: {
    movementCount: number
    netQuantity: number
    byType: Record<string, number>
    lowStockCount: number
  }
  trend: InventoryTrendPoint[]
  lowStock: Array<{
    code: string
    name: string
    stock: number
    minimumStock: number
    unitLabel: string
  }>
}

export interface ServicesBlockData {
  block: 'services'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: 'day' | 'week' | 'month'
  metrics: {
    serviceCount: number
    unitsSold: number
    amount: number
    averagePerUnit: number
  }
  trend: TrendPoint[]
  top: Array<{
    code: string
    name: string
    quantity: number
    amount: number
  }>
}

export interface WorkshopBlockData {
  block: 'workshop'
  descriptor: ReportDescriptor
  period: ReportPeriod
  granularity: 'day' | 'week' | 'month'
  metrics: {
    workOrderCount: number
    workOrdersByStatus: Record<string, number>
    deliveredCount: number
    averageDeliveryHours: number | null
    appointmentCount: number
    appointmentsByStatus: Record<string, number>
  }
  trend: WorkshopTrendPoint[]
}

export type BlockData =
  | SalesBlockData
  | PaymentsBlockData
  | InventoryBlockData
  | ServicesBlockData
  | WorkshopBlockData

export interface ReportSummary {
  generatedAt: string
  period: ReportPeriod
  blocks: Partial<Record<ReportBlock, ReportDescriptor>>
}
