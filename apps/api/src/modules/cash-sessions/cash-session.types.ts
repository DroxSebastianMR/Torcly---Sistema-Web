export type CashSessionStatus = 'OPEN' | 'CLOSED'
export type CashPaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET'

export interface CashMethodTotals {
  cash: number
  card: number
  transfer: number
  digitalWallet: number
}

export interface CashSessionTotals {
  payments: CashMethodTotals
  compensations: CashMethodTotals
  net: CashMethodTotals
  expectedCashAmount: number
}

export interface CashSessionSummary {
  id: string
  code: string
  status: CashSessionStatus
  openingAmount: number
  openingNotes: string | null
  openedBy: string
  openedAt: string
  expectedCashAmount: number | null
  countedCashAmount: number | null
  differenceAmount: number | null
  closingNotes: string | null
  closedBy: string | null
  closedAt: string | null
  totals: CashSessionTotals
}

export interface CashSessionListFilters {
  page: number
  pageSize: number
}

export interface CashSessionListResponse {
  data: CashSessionSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CashSessionOpenInput {
  requestId: string
  openingAmount: number
  notes?: string
}

export interface CashSessionCloseInput {
  requestId: string
  countedCashAmount: number
  notes?: string
}
