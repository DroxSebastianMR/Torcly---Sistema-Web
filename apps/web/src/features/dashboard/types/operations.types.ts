export type OperationalSection =
  | 'appointments'
  | 'workOrders'
  | 'sales'
  | 'payments'
  | 'inventory'
export interface Period {
  from: string | null
  to: string | null
}
export interface Summary {
  generatedAt: string
  period: Period
  sections: Partial<Record<OperationalSection, Record<string, unknown>>>
  descriptors: Record<OperationalSection, { label: string; criteria: string }>
}
export interface Attention {
  section: OperationalSection
  data: Array<Record<string, unknown>>
  pagination: { page: number; total: number; totalPages: number }
  descriptor: { label: string; criteria: string }
}
