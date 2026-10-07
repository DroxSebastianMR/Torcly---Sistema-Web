export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET'
export type PaymentMethodFilter = 'all' | PaymentMethod
export type PaymentType = 'PAYMENT' | 'COMPENSATION'
export type PaymentCollectionStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID'
export type PaymentCollectionStatusFilter = 'all' | PaymentCollectionStatus

export interface PaymentCustomerRef {
  id: string
  documentNumber: string
  name: string
}

export interface PaymentFilters {
  search: string
  status: PaymentCollectionStatusFilter
  method: PaymentMethodFilter
  from: string | null | undefined
  to: string | null | undefined
  page: number
  pageSize: number
}

export interface PaymentObligationSummary {
  id: string
  code: string
  customer: PaymentCustomerRef | null
  status: 'CONFIRMED'
  total: number
  paid: number
  balance: number
  collectionStatus: PaymentCollectionStatus
  confirmedAt: string
  createdAt: string
}

export interface PaymentEvent {
  id: string
  code: string
  type: PaymentType
  amount: number
  netAmount: number
  method: PaymentMethod
  performedBy: string
  notes: string | null
  reason: string | null
  originalCode: string | null
  occurredAt: string
  createdAt: string
}

export interface PaymentDetail extends PaymentObligationSummary {
  events: PaymentEvent[]
}

export interface PaymentObligationsSummary {
  pendingCount: number
  pendingAmount: number
  collectedAmount: number
}

export interface PaymentsResponse {
  data: PaymentObligationSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: PaymentObligationsSummary
}

export interface PaymentRegisterInput {
  requestId: string
  amount: number
  method: PaymentMethod
  notes?: string
}

export interface PaymentCompensateInput {
  requestId: string
  amount: number
  reason: string
  notes?: string
}
