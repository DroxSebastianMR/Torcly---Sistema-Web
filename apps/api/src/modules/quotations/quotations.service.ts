import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import { assertHasItems } from './quotations.rules.js'
import {
  quotationsRepository,
  type QuotationDetailRecord,
  type QuotationItemRecord,
  type QuotationSummaryRecord,
} from './quotations.repository.js'
import type {
  QuotationCreateInput,
  QuotationDetail,
  QuotationFilters,
  QuotationItemResponse,
  QuotationSummary,
  QuotationUpdateInput,
} from './quotations.types.js'

type Actor = { id: string; name: string }

type QuotationRecord = QuotationSummaryRecord | QuotationDetailRecord

function toCustomerRef(customer: QuotationRecord['customer']) {
  if (!customer) return null
  return {
    id: customer.id,
    documentNumber: customer.documentNumber,
    name:
      (customer.legalName ??
        [customer.firstName, customer.lastName].filter(Boolean).join(' ')) ||
      'Sin nombre',
    phone: customer.phone,
    email: customer.email ?? null,
  }
}

function toVehicleRef(vehicle: QuotationRecord['vehicle']) {
  if (!vehicle) return null
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
  }
}

function toItemResponse(item: QuotationItemRecord): QuotationItemResponse {
  return {
    id: item.id,
    type: item.type,
    productId: item.productId ?? null,
    serviceId: item.serviceId ?? null,
    name: item.name,
    code: item.code,
    unitLabel: item.unitLabel ?? null,
    unitPrice: Number(item.unitPrice),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
  }
}

function toSummary(quotation: QuotationRecord): QuotationSummary {
  return {
    id: quotation.id,
    code: quotation.code,
    customer: toCustomerRef(quotation.customer),
    vehicle: toVehicleRef(quotation.vehicle),
    vehiclePlate: quotation.vehiclePlate ?? quotation.vehicle?.plate ?? null,
    status: quotation.status,
    subtotal: Number(quotation.subtotal),
    total: Number(quotation.total),
    validUntil: quotation.validUntil
      ? quotation.validUntil.toISOString()
      : null,
    notes: quotation.notes ?? null,
    workOrderId: quotation.workOrderId ?? null,
    createdBy: quotation.createdBy,
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    itemCount:
      'items' in quotation ? quotation.items.length : quotation._count.items,
  }
}

function toDetail(quotation: QuotationDetailRecord): QuotationDetail {
  return {
    ...toSummary(quotation),
    items: quotation.items.map(toItemResponse),
  }
}

export const quotationsService = {
  async list(filters: QuotationFilters, organizationId: string) {
    const result = await quotationsRepository.list(filters, organizationId)
    return {
      data: result.items.map(toSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },

  async getById(id: string, organizationId: string) {
    const quotation = await quotationsRepository.findById(id, organizationId)
    if (!quotation) {
      throw new AppError(
        404,
        'QUOTATION_NOT_FOUND',
        'Cotización no encontrada.',
      )
    }
    return { data: toDetail(quotation) }
  },

  async create(
    input: QuotationCreateInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ) {
    assertHasItems(input.items)
    const quotation = await quotationsRepository.create(
      input,
      actor,
      context,
      organizationId,
    )
    return { data: toDetail(quotation) }
  },

  async update(
    id: string,
    input: QuotationUpdateInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ) {
    assertHasItems(input.items)
    const quotation = await quotationsRepository.update(
      id,
      input,
      actor,
      context,
      organizationId,
    )
    return { data: toDetail(quotation) }
  },

  async convertToOrder(
    id: string,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ) {
    const result = await quotationsRepository.convertToOrder(
      id,
      actor,
      context,
      organizationId,
    )
    return {
      data: {
        quotation: toDetail(result.quotation),
        workOrder: result.workOrder,
      },
    }
  },
}
