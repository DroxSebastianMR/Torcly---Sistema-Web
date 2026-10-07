import {
  collectionStatusFromBalance,
  computeBalance,
  computePaidAmount,
} from '../payments/payment.rules.js'
import { operationsRepository } from './operations.repository.js'
import {
  assertSectionAccess,
  assertValidPeriod,
  authorizedSections,
  paginate,
  SECTION_DESCRIPTORS,
} from './operations.rules.js'
import type {
  AttentionItem,
  OperationalAttentionResponse,
  OperationalFilters,
  OperationalSection,
  OperationalSummary,
  OperationalSectionSummary,
  Pagination,
} from './operations.types.js'
import {
  dateToString,
  timeToString,
} from '../appointments/appointment.rules.js'

function customerName(
  customer: {
    firstName: string | null
    lastName: string | null
    legalName: string | null
  } | null,
): string {
  if (!customer) return 'Sin cliente'
  const full =
    customer.legalName ??
    [customer.firstName, customer.lastName].filter(Boolean).join(' ')
  return full || 'Sin nombre'
}

function buildPagination(
  page: number,
  pageSize: number,
  total: number,
): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return { page: Math.min(page, totalPages), pageSize, total, totalPages }
}

async function buildSection(
  section: OperationalSection,
  from: string | null,
  to: string | null,
): Promise<OperationalSectionSummary> {
  switch (section) {
    case 'appointments': {
      const byStatus = await operationsRepository.countAppointmentsByStatus(
        from,
        to,
      )
      return {
        section: 'appointments',
        byStatus,
        total: byStatus.PROGRAMADA + byStatus.CANCELADA + byStatus.ATENDIDA,
        attentionCount: byStatus.PROGRAMADA,
      }
    }
    case 'workOrders': {
      const byStatus = await operationsRepository.countWorkOrdersByStatus(
        from,
        to,
      )
      const total = Object.values(byStatus).reduce(
        (sum, value) => sum + value,
        0,
      )
      const attentionCount =
        byStatus.RECEPCIONADA +
        byStatus.EN_DIAGNOSTICO +
        byStatus.PENDIENTE_APROBACION +
        byStatus.APROBADA +
        byStatus.EN_EJECUCION +
        byStatus.LISTA_PARA_ENTREGA
      return { section: 'workOrders', byStatus, total, attentionCount }
    }
    case 'sales': {
      const { confirmedCount, confirmedAmount } =
        await operationsRepository.summarizeSales(from, to)
      return { section: 'sales', confirmedCount, confirmedAmount }
    }
    case 'payments': {
      const obligations = await operationsRepository.listPendingObligations()
      const pending = obligations
        .map((obligation) => {
          const paid = computePaidAmount(obligation.payments)
          return {
            balance: computeBalance(obligation.total, paid),
          }
        })
        .filter((obligation) => obligation.balance > 0)
      return {
        section: 'payments',
        pendingCount: pending.length,
        pendingAmount: pending.reduce(
          (sum, obligation) => sum + obligation.balance,
          0,
        ),
      }
    }
    case 'inventory': {
      const products = await operationsRepository.listLowStockProducts()
      return { section: 'inventory', lowStockCount: products.length }
    }
  }
}

async function buildAttention(
  section: OperationalSection,
  filters: OperationalFilters,
): Promise<{ data: AttentionItem[]; pagination: Pagination }> {
  const { from, to } = assertValidPeriod(filters.from, filters.to)
  const { page, pageSize } = filters
  const skip = (page - 1) * pageSize

  switch (section) {
    case 'appointments': {
      const { items, total } =
        await operationsRepository.listAppointmentAttention(
          from,
          to,
          skip,
          pageSize,
        )
      return {
        data: items.map((item) => ({
          code: item.code,
          date: dateToString(item.date),
          time: timeToString(item.time),
          status: item.status,
          customerName: customerName(item.customer),
          vehiclePlate: item.vehicle?.plate ?? 'Sin placa',
        })),
        pagination: buildPagination(page, pageSize, total),
      }
    }
    case 'workOrders': {
      const { items, total } =
        await operationsRepository.listWorkOrderAttention(
          from,
          to,
          skip,
          pageSize,
        )
      return {
        data: items.map((item) => ({
          code: item.code,
          status: item.status,
          customerName: customerName(item.customer),
          vehiclePlate: item.vehicle?.plate ?? 'Sin placa',
          createdAt: item.createdAt.toISOString(),
        })),
        pagination: buildPagination(page, pageSize, total),
      }
    }
    case 'sales': {
      const { items, total } = await operationsRepository.listSaleAttention(
        from,
        to,
        skip,
        pageSize,
      )
      return {
        data: items.map((item) => ({
          code: item.code,
          customerName: item.customer ? customerName(item.customer) : null,
          total: item.total,
          confirmedAt: item.confirmedAt.toISOString(),
        })),
        pagination: buildPagination(page, pageSize, total),
      }
    }
    case 'payments': {
      const obligations = await operationsRepository.listPendingObligations()
      const pending = obligations
        .map((obligation) => {
          const paid = computePaidAmount(obligation.payments)
          const balance = computeBalance(obligation.total, paid)
          return {
            code: obligation.code,
            customerName: obligation.customer
              ? customerName(obligation.customer)
              : null,
            total: obligation.total,
            paid,
            balance,
            collectionStatus: collectionStatusFromBalance(paid, balance),
            confirmedAt: obligation.confirmedAt.toISOString(),
          }
        })
        .filter((item) => item.balance > 0)
      return paginate(pending, page, pageSize)
    }
    case 'inventory': {
      const products = await operationsRepository.listLowStockProducts()
      return paginate(products, page, pageSize)
    }
  }
}

export const operationsService = {
  async getSummary(
    filters: Pick<OperationalFilters, 'from' | 'to'>,
    permissions: readonly string[],
  ): Promise<OperationalSummary> {
    const { from, to } = assertValidPeriod(filters.from, filters.to)
    const allowed = authorizedSections(permissions)
    const entries = await Promise.all(
      allowed.map(
        async (section) =>
          [section, await buildSection(section, from, to)] as const,
      ),
    )
    const sections = Object.fromEntries(
      entries,
    ) as OperationalSummary['sections']
    return {
      generatedAt: new Date().toISOString(),
      period: { from, to },
      sections,
      descriptors: SECTION_DESCRIPTORS,
    }
  },

  async getAttention(
    section: OperationalSection,
    filters: OperationalFilters,
    permissions: readonly string[],
  ): Promise<OperationalAttentionResponse> {
    assertSectionAccess(section, permissions)
    const { from, to } = assertValidPeriod(filters.from, filters.to)
    const { data, pagination } = await buildAttention(section, filters)
    return {
      section,
      descriptor: SECTION_DESCRIPTORS[section],
      period: { from, to },
      data,
      pagination,
    }
  },
}
