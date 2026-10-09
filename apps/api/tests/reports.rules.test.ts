import { describe, expect, it } from 'vitest'
import {
  addDaysISO,
  assertBlockAccess,
  authorizedBlocks,
  BLOCK_DESCRIPTORS,
  BLOCK_PERMISSIONS,
  buildBuckets,
  bucketKey,
  bucketLabel,
  canAccessBlock,
  isReportBlock,
  resolveGranularity,
  resolvePeriod,
} from '../src/modules/reports/reports.rules.js'
import {
  REPORT_BLOCKS,
  type ReportBlock,
} from '../src/modules/reports/reports.types.js'

const ALL_PERMISSIONS = [
  'reports:read',
  'sales:read',
  'cash:read',
  'inventory:read',
  'services:read',
  'workshop:read',
  'appointments:read',
]

describe('Reglas de reportes', () => {
  it('reconoce y valida los bloques de reporte', () => {
    expect(REPORT_BLOCKS).toEqual([
      'sales',
      'payments',
      'inventory',
      'services',
      'workshop',
    ])
    expect(isReportBlock('sales')).toBe(true)
    expect(isReportBlock('payments')).toBe(true)
    expect(isReportBlock('unknown')).toBe(false)
  })

  it('exige los permisos de lectura declarados por bloque', () => {
    expect(canAccessBlock('sales', ['sales:read'])).toBe(true)
    expect(canAccessBlock('payments', ['cash:read', 'sales:read'])).toBe(true)
    expect(canAccessBlock('payments', ['sales:read'])).toBe(false)
    expect(canAccessBlock('services', ['sales:read'])).toBe(false)
    expect(canAccessBlock('services', ['sales:read', 'services:read'])).toBe(
      true,
    )
    expect(canAccessBlock('workshop', ['workshop:read'])).toBe(false)
    expect(
      canAccessBlock('workshop', ['workshop:read', 'appointments:read']),
    ).toBe(true)
    expect(authorizedBlocks(['sales:read'])).toEqual(['sales'])
    expect(authorizedBlocks([])).toEqual([])
  })

  it('rechaza el acceso a un bloque sin sus permisos', () => {
    try {
      assertBlockAccess('inventory', ['sales:read'])
      expect.unreachable()
    } catch (error) {
      expect(error).toMatchObject({
        status: 403,
        code: 'REPORTS_BLOCK_FORBIDDEN',
      })
    }
  })

  it('describe cada bloque con fuente, período, criterio y permisos', () => {
    for (const block of REPORT_BLOCKS) {
      const descriptor = BLOCK_DESCRIPTORS[block]
      expect(descriptor.block).toBe(block)
      expect(descriptor.label.length).toBeGreaterThan(0)
      expect(descriptor.source.length).toBeGreaterThan(0)
      expect(descriptor.periodField.length).toBeGreaterThan(0)
      expect(descriptor.criteria.length).toBeGreaterThan(0)
      expect(descriptor.permissions).toEqual([...BLOCK_PERMISSIONS[block]])
      expect(
        descriptor.permissions.every(
          (permission) =>
            typeof permission === 'string' && permission.endsWith(':read'),
        ),
      ).toBe(true)
    }
  })

  it('resuelve el período con predefinido de 30 días hasta hoy', () => {
    const period = resolvePeriod(undefined, '2026-10-31')
    expect(period.from).toBe('2026-10-01')
    expect(period.to).toBe('2026-10-31')

    const explicit = resolvePeriod('2026-10-01', '2026-10-15')
    expect(explicit).toEqual({ from: '2026-10-01', to: '2026-10-15' })

    const onlyFrom = resolvePeriod('2026-10-01', undefined)
    expect(onlyFrom.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('rechaza un período invertido', () => {
    try {
      resolvePeriod('2026-10-05', '2026-10-01')
      expect.unreachable()
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        code: 'REPORTS_DATE_RANGE_INVALID',
      })
    }
  })

  it('ajusta la granularidad según el rango del período', () => {
    expect(resolveGranularity('2026-10-01', '2026-10-31')).toBe('day')
    expect(resolveGranularity('2026-10-01', '2026-11-01')).toBe('week')
    expect(resolveGranularity('2026-01-01', '2026-12-31')).toBe('month')
    expect(resolveGranularity('2026-01-01', '2027-07-05')).toBe('month')
  })

  it('calcula la clave de segmento por día, semana y mes', () => {
    const granularityDay = 'day'
    const monday = new Date('2026-10-05T00:00:00.000Z')
    const sunday = new Date('2026-10-11T00:00:00.000Z')
    expect(bucketKey(monday, granularityDay)).toBe('2026-10-05')
    expect(bucketKey(sunday, 'week')).toBe('2026-10-05')
    expect(bucketKey(monday, 'month')).toBe('2026-10')
  })

  it('construye segmentos diarios, semanales y mensuales etiquetados', () => {
    const days = buildBuckets('2026-10-01', '2026-10-31', 'day')
    expect(days).toHaveLength(31)
    expect(days[0]).toEqual({ key: '2026-10-01', label: '1 oct' })
    expect(days[30]).toEqual({ key: '2026-10-31', label: '31 oct' })

    const weeks = buildBuckets('2026-10-01', '2026-11-01', 'week')
    expect(weeks.map((bucket) => bucket.key)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ])
    expect(weeks[0].label).toBe('28 sep–4 oct')
    expect(weeks[4].label).toBe('26 oct–1 nov')

    const months = buildBuckets('2026-10-01', '2026-12-15', 'month')
    expect(months).toEqual([
      { key: '2026-10', label: 'oct 2026' },
      { key: '2026-11', label: 'nov 2026' },
      { key: '2026-12', label: 'dic 2026' },
    ])
  })

  it('genera claves y etiquetas de segmento consistentes', () => {
    expect(bucketLabel('2026-10-05', 'day')).toBe('5 oct')
    expect(bucketLabel('2026-10-05', 'week')).toBe('5–11 oct')
    expect(bucketLabel('2026-10', 'month')).toBe('oct 2026')
    expect(addDaysISO('2026-10-31', 1)).toBe('2026-11-01')
  })

  it('expone todos los bloques con permisos y descriptores alineados', () => {
    const blocks: ReportBlock[] = [...REPORT_BLOCKS]
    expect(blocks).toHaveLength(5)
    for (const block of blocks) {
      expect(BLOCK_PERMISSIONS[block].length).toBeGreaterThan(0)
      expect(BLOCK_DESCRIPTORS[block].permissions).toEqual([
        ...BLOCK_PERMISSIONS[block],
      ])
    }
    expect(authorizedBlocks(ALL_PERMISSIONS)).toEqual(blocks)
  })
})
