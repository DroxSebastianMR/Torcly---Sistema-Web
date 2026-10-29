import { describe, expect, it } from 'vitest'
import {
  assertSectionAccess,
  assertValidPeriod,
  authorizedSections,
  canAccessSection,
  isOperationalSection,
  paginate,
  SECTION_DESCRIPTORS,
  SECTION_PERMISSIONS,
} from '../src/modules/operations/operations.rules.js'
import { OPERATIONAL_SECTIONS } from '../src/modules/operations/operations.types.js'

function captureError(run: () => unknown): unknown {
  try {
    run()
    return null
  } catch (error) {
    return error
  }
}

describe('Reglas de consulta operativa', () => {
  it('describe cada sección con fuente, período, criterio y permisos', () => {
    expect(Object.keys(SECTION_DESCRIPTORS).sort()).toEqual(
      [...OPERATIONAL_SECTIONS].sort(),
    )
    for (const section of OPERATIONAL_SECTIONS) {
      const descriptor = SECTION_DESCRIPTORS[section]
      expect(descriptor.section).toBe(section)
      expect(descriptor.label.length).toBeGreaterThan(0)
      expect(descriptor.source.length).toBeGreaterThan(0)
      expect(descriptor.periodField.length).toBeGreaterThan(0)
      expect(descriptor.criteria.length).toBeGreaterThan(0)
      expect(descriptor.permissions).toEqual([...SECTION_PERMISSIONS[section]])
      expect(descriptor.permissions.length).toBeGreaterThan(0)
    }
    expect(SECTION_DESCRIPTORS.payments.periodField).toBe('snapshot')
    expect(SECTION_DESCRIPTORS.inventory.periodField).toBe('snapshot')
    expect(SECTION_DESCRIPTORS.appointments.periodField).toBe('date')
    expect(SECTION_DESCRIPTORS.workOrders.periodField).toBe('createdAt')
    expect(SECTION_DESCRIPTORS.sales.periodField).toBe('confirmedAt')
  })

  it('autoriza secciones solo con todos sus permisos', () => {
    expect(canAccessSection('sales', ['sales:read'])).toBe(true)
    expect(canAccessSection('sales', [])).toBe(false)
    expect(canAccessSection('payments', ['cash:read'])).toBe(false)
    expect(canAccessSection('payments', ['cash:read', 'sales:read'])).toBe(true)
    expect(authorizedSections(['inventory:read', 'sales:read'])).toEqual([
      'sales',
      'inventory',
    ])
    expect(authorizedSections(['sales:read'])).toEqual(['sales'])
  })

  it('rechaza una sección sin permiso con 403', () => {
    const forbidden = captureError(() =>
      assertSectionAccess('workOrders', ['sales:read']),
    )
    expect(forbidden).toMatchObject({
      status: 403,
      code: 'OPERATIONS_SECTION_FORBIDDEN',
    })
    expect(() =>
      assertSectionAccess('workOrders', ['workshop:read']),
    ).not.toThrow()
  })

  it('valida el período invertido y normaliza vacíos', () => {
    const inverted = captureError(() =>
      assertValidPeriod('2026-10-05', '2026-10-01'),
    )
    expect(inverted).toMatchObject({
      status: 400,
      code: 'OPERATIONS_DATE_RANGE_INVALID',
    })
    expect(assertValidPeriod('2026-10-01', '2026-10-05')).toEqual({
      from: '2026-10-01',
      to: '2026-10-05',
    })
    expect(assertValidPeriod(undefined, '  ')).toEqual({ from: null, to: null })
    expect(assertValidPeriod(null, null)).toEqual({ from: null, to: null })
  })

  it('identifica secciones válidas', () => {
    expect(isOperationalSection('payments')).toBe(true)
    expect(isOperationalSection('nada')).toBe(false)
  })

  it('pagina en memoria con página fuera de rango ajustada', () => {
    const items = Array.from({ length: 7 }, (_, index) => index)
    expect(paginate(items, 2, 5)).toMatchObject({
      data: [5, 6],
      pagination: { page: 2, pageSize: 5, total: 7, totalPages: 2 },
    })
    expect(paginate([], 1, 10).pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
    })
    expect(paginate(items, 9, 5).pagination.page).toBe(2)
  })
})
