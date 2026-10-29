import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { inventoryService, movementTypeOptions } from './inventory.service'

describe('Servicio de inventario (web)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.patch.mockReset()
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.patch.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('consulta las existencias con filtros y paginación', async () => {
    await inventoryService.listExistence({
      search: 'filtro',
      page: 2,
      pageSize: 50,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/inventory/existencia?page=2&pageSize=50&search=filtro',
      undefined,
    )
  })

  it('omite la búsqueda vacía en el query string', async () => {
    await inventoryService.listExistence({
      search: '   ',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/inventory/existencia?page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el historial con los filtros de movimiento', async () => {
    await inventoryService.listMovements({
      productId: 'p1',
      type: 'EXIT',
      from: '2026-01-01',
      to: '2026-01-31',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/inventory/historial?page=1&pageSize=20&productId=p1&type=EXIT&from=2026-01-01&to=2026-01-31',
      undefined,
    )
  })

  it('registra movimientos en los endpoints correctos', async () => {
    const input = {
      productId: 'p1',
      quantity: 5,
      idempotencyKey: 'entrada-mi',
      notes: 'Ingreso de compra',
    }

    await inventoryService.registerInitial(input)
    expect(api.post).toHaveBeenCalledWith('/inventory/stock-inicial', input)

    await inventoryService.registerEntry(input)
    expect(api.post).toHaveBeenCalledWith('/inventory/entradas', input)

    await inventoryService.registerExit(input)
    expect(api.post).toHaveBeenCalledWith('/inventory/salidas', input)

    await inventoryService.registerAdjustment(input)
    expect(api.post).toHaveBeenCalledWith('/inventory/ajustes', input)
  })

  it('entrega las opciones de tipo de movimiento para el filtro', () => {
    expect(movementTypeOptions()).toEqual([
      { value: '', label: 'Todos los tipos' },
      { value: 'INITIAL', label: 'Stock inicial' },
      { value: 'ENTRY', label: 'Entradas' },
      { value: 'EXIT', label: 'Salidas' },
      { value: 'ADJUSTMENT_IN', label: 'Ajustes de ingreso' },
      { value: 'ADJUSTMENT_OUT', label: 'Ajustes de egreso' },
    ])
  })
})
