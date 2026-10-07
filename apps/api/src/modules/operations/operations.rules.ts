import { AppError } from '../../shared/errors/app-error.js'
import type {
  OperationalSection,
  SectionDescriptor,
  WorkOrderStatus,
} from './operations.types.js'
import { OPERATIONAL_SECTIONS } from './operations.types.js'

export const WORK_ORDER_ATTENTION_STATUSES: readonly WorkOrderStatus[] = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
  'APROBADA',
  'EN_EJECUCION',
  'LISTA_PARA_ENTREGA',
]

export const SECTION_PERMISSIONS: Record<
  OperationalSection,
  readonly string[]
> = {
  appointments: ['appointments:read'],
  workOrders: ['workshop:read'],
  sales: ['sales:read'],
  payments: ['cash:read', 'sales:read'],
  inventory: ['inventory:read'],
}

export const SECTION_DESCRIPTORS: Record<
  OperationalSection,
  SectionDescriptor
> = {
  appointments: {
    section: 'appointments',
    label: 'Citas',
    source: 'appointments',
    periodField: 'date',
    criteria:
      'Citas programadas, canceladas y atendidas con fecha dentro del período.',
    permissions: [...SECTION_PERMISSIONS.appointments],
  },
  workOrders: {
    section: 'workOrders',
    label: 'Órdenes de taller',
    source: 'work_orders',
    periodField: 'createdAt',
    criteria:
      'Órdenes creadas dentro del período, agrupadas por etapa; la atención reúne las que aún no están entregadas ni rechazadas.',
    permissions: [...SECTION_PERMISSIONS.workOrders],
  },
  sales: {
    section: 'sales',
    label: 'Ventas confirmadas',
    source: 'sales',
    periodField: 'confirmedAt',
    criteria:
      'Ventas confirmadas cuya confirmación ocurrió dentro del período.',
    permissions: [...SECTION_PERMISSIONS.sales],
  },
  payments: {
    section: 'payments',
    label: 'Saldos pendientes',
    source: 'payments',
    periodField: 'snapshot',
    criteria:
      'Instantánea actual de ventas confirmadas con saldo pendiente; el período no altera el saldo y los montos se calculan en servidor.',
    permissions: [...SECTION_PERMISSIONS.payments],
  },
  inventory: {
    section: 'inventory',
    label: 'Alertas de stock',
    source: 'inventory_movements',
    periodField: 'snapshot',
    criteria:
      'Instantánea actual de productos activos cuyo stock confirmado es menor o igual al stock mínimo; el período no aplica.',
    permissions: [...SECTION_PERMISSIONS.inventory],
  },
}

export function isOperationalSection(
  value: string,
): value is OperationalSection {
  return (OPERATIONAL_SECTIONS as readonly string[]).includes(value)
}

export function canAccessSection(
  section: OperationalSection,
  permissions: readonly string[],
): boolean {
  return SECTION_PERMISSIONS[section].every((permission) =>
    permissions.includes(permission),
  )
}

export function authorizedSections(
  permissions: readonly string[],
): OperationalSection[] {
  return OPERATIONAL_SECTIONS.filter((section) =>
    canAccessSection(section, permissions),
  )
}

export function assertSectionAccess(
  section: OperationalSection,
  permissions: readonly string[],
): void {
  if (!canAccessSection(section, permissions)) {
    throw new AppError(
      403,
      'OPERATIONS_SECTION_FORBIDDEN',
      'No tienes permiso para consultar esta sección operativa.',
    )
  }
}

export function assertValidPeriod(
  from: string | null | undefined,
  to: string | null | undefined,
): { from: string | null; to: string | null } {
  const normalizedFrom = from?.trim() || null
  const normalizedTo = to?.trim() || null
  if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
    throw new AppError(
      400,
      'OPERATIONS_DATE_RANGE_INVALID',
      'La fecha inicial no puede ser posterior a la fecha final.',
    )
  }
  return { from: normalizedFrom, to: normalizedTo }
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      total: items.length,
      totalPages,
    },
  }
}
