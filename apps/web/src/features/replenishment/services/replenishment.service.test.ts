import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import {
  eligibilityOptions,
  priorityOptions,
  replenishmentService,
} from './replenishment.service'

describe('Servicio de reabastecimiento (web)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.patch.mockReset()
    api.get.mockResolvedValue({})
    api.post.mockResolvedValue({})
    api.put.mockResolvedValue({})
    api.patch.mockResolvedValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('consulta la elegibilidad con período, cobertura, filtros y paginación', async () => {
    await replenishmentService.getEligibility({
      from: '2026-10-01',
      to: '2026-10-31',
      coverageDays: 30,
      search: 'filtro',
      priority: 'ALTA',
      eligible: 'true',
      page: 2,
      pageSize: 50,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/replenishment/eligibility?coverageDays=30&page=2&pageSize=50&from=2026-10-01&to=2026-10-31&search=filtro&priority=ALTA&eligible=true',
      undefined,
    )
  })

  it('omite los filtros vacíos en la consulta de elegibilidad', async () => {
    await replenishmentService.getEligibility({
      from: '',
      to: '',
      coverageDays: 30,
      search: '   ',
      priority: '',
      eligible: '',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/replenishment/eligibility?coverageDays=30&page=1&pageSize=20',
      undefined,
    )
  })

  it('crea una corrida enviando el período, la cobertura y la clave de idempotencia', async () => {
    const input = {
      from: '2026-10-01',
      to: '2026-10-31',
      coverageDays: 30,
      idempotencyKey: 'replenishment-run-mi',
    }

    await replenishmentService.createRun(input)

    expect(api.post).toHaveBeenCalledWith('/replenishment/runs', input)
  })

  it('consulta el historial de corridas con filtro de fechas', async () => {
    await replenishmentService.listRuns({
      from: '2026-10-01',
      to: '2026-10-31',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/replenishment/runs?page=1&pageSize=20&from=2026-10-01&to=2026-10-31',
      undefined,
    )
  })

  it('consulta el historial sin filtro de fechas', async () => {
    await replenishmentService.listRuns({
      from: '',
      to: '',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/replenishment/runs?page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el detalle de la corrida por código con filtros', async () => {
    await replenishmentService.getRunDetail(
      'RAB-000001',
      {
        search: 'aceite',
        priority: 'CRITICA',
        eligible: 'true',
        page: 1,
        pageSize: 20,
      },
      undefined,
    )

    expect(api.get).toHaveBeenCalledWith(
      '/replenishment/runs/RAB-000001?page=1&pageSize=20&search=aceite&priority=CRITICA&eligible=true',
      undefined,
    )
  })

  it('entrega las opciones de prioridad para el filtro', () => {
    expect(priorityOptions()).toEqual([
      { value: '', label: 'Todas las prioridades' },
      { value: 'CRITICA', label: 'Crítica' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'MEDIA', label: 'Media' },
      { value: 'BAJA', label: 'Baja' },
    ])
  })

  it('entrega las opciones de elegibilidad para el filtro', () => {
    expect(eligibilityOptions()).toEqual([
      { value: '', label: 'Todos los productos' },
      { value: 'true', label: 'Solo elegibles' },
      { value: 'false', label: 'Solo no elegibles' },
    ])
  })
})
