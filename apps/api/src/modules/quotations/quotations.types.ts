export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'APPROVED'
  | 'EXPIRED'
  | 'REJECTED'

export type QuotationStatusFilter = 'all' | QuotationStatus

export interface QuotationFilters {
  search?: string
  status: QuotationStatusFilter
  page: number
  pageSize: number
}

export interface QuotationItemInput {
  type: 'PRODUCT' | 'SERVICE'
  productId?: string | null
  serviceId?: string | null
  name?: string
  code?: string
  unitLabel?: string | null
  unitPrice?: number
  quantity?: number
}

export interface QuotationCreateInput {
  customerId?: string | null
  vehicleId?: string | null
  vehiclePlate?: string | null
  validUntil?: string | null
  notes?: string | null
  items: QuotationItemInput[]
}

export interface QuotationUpdateInput extends QuotationCreateInput {
  status?: QuotationStatus
}

export type QuotationConversionInput =
  | { mode: 'EXISTING'; customerId: string; vehicleId: string }
  | {
      mode: 'NEW'
      customer:
        | {
            type: 'NATURAL'
            documentNumber: string
            firstName: string
            lastName: string
            phone: string
            email?: string | null
            vehicle: {
              plate: string
              brand: string
              model: string
              year: number
              mileage?: number | null
            }
          }
        | {
            type: 'LEGAL'
            documentNumber: string
            legalName: string
            phone: string
            email?: string | null
            vehicle: {
              plate: string
              brand: string
              model: string
              year: number
              mileage?: number | null
            }
          }
    }

export interface QuotationCustomerRef {
  id: string
  documentNumber: string
  name: string
  phone: string
  email: string | null
}

export interface QuotationVehicleRef {
  id: string
  plate: string
  brand: string
  model: string
  year: number
}

export interface QuotationItemResponse {
  id: string
  type: 'PRODUCT' | 'SERVICE'
  productId: string | null
  serviceId: string | null
  name: string
  code: string
  unitLabel: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface QuotationSummary {
  id: string
  code: string
  customer: QuotationCustomerRef | null
  vehicle: QuotationVehicleRef | null
  vehiclePlate: string | null
  status: QuotationStatus
  subtotal: number
  total: number
  validUntil: string | null
  notes: string | null
  workOrderId: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  itemCount: number
}

export interface QuotationDetail extends QuotationSummary {
  items: QuotationItemResponse[]
}
