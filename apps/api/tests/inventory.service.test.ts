import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'
import { AppError } from '../src/shared/errors/app-error.js'

const repository = vi.hoisted(() => ({
  listExistence: vi.fn(),
  listMovements: vi.fn(),
  findUserDisplayNames: vi.fn(),
  registerMovement: vi.fn(),
  findByKey: vi.fn(),
}))

vi.mock('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: repository,
}))

import { inventoryService } from '../src/modules/inventory/inventory.service.js'

const context = {
  requestId: 'req-inv-1',
  ipAddress: '127.0.0.1',
}

const actor = { id: 'actor-1', name: 'Operador Torcly' }

function movement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mov1',
    productId: 'p1',
    type: 'ENTRY',
    quantity: 5,
    notes: null,
    performedBy: 'Operador Torcly',
    occurredAt: new Date('2026-09-27T10:00:00.000Z'),
    referenceType: null,
    referenceId: null,
    product: {
      id: 'p1',
      code: 'REP-001',
      name: 'Filtro de aceite',
      unit: { name: 'Unidad', symbol: 'und' },
    },
    ...overrides,
  }
}

describe('Servicio de inventario', () => {
  beforeEach(() => {
    for (const mock of Object.values(repository)) mock.mockReset()
  })

  it('lista existencias con paginación', async () => {
    repository.listExistence.mockResolvedValue({
      items: [
        {
          productId: 'p1',
          code: 'REP-001',
          name: 'Filtro de aceite',
          unit: { name: 'Unidad', symbol: 'und' },
          active: true,
          stock: 12,
          minimumStock: 4,
          lowStock: false,
          lastMovementAt: '2026-09-27T10:00:00.000Z',
        },
      ],
      total: 1,
    })

    const result = await inventoryService.listExistence({
      search: 'filtro',
      page: 1,
      pageSize: 20,
    })

    expect(repository.listExistence).toHaveBeenCalledWith({
      search: 'filtro',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          productId: 'p1',
          code: 'REP-001',
          name: 'Filtro de aceite',
          unit: { name: 'Unidad', symbol: 'und' },
          active: true,
          stock: 12,
          minimumStock: 4,
          lowStock: false,
          lastMovementAt: '2026-09-27T10:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })
  })

  it('lista movimientos con tipo, producto, fecha, usuario y origen', async () => {
    repository.listMovements.mockResolvedValue({
      items: [movement()],
      total: 1,
    })

    const result = await inventoryService.listMovements({
      type: 'ENTRY',
      from: '2026-09-01',
      to: '2026-09-30',
      page: 1,
      pageSize: 20,
    })

    expect(result.data[0]).toMatchObject({
      id: 'mov1',
      type: 'ENTRY',
      quantity: 5,
      performedBy: 'Operador Torcly',
      occurredAt: '2026-09-27T10:00:00.000Z',
      product: { code: 'REP-001', name: 'Filtro de aceite' },
    })
  })

  it('resuelve el nombre de los operadores guardados como UUID', async () => {
    const operatorId = 'ad311bf4-c52d-4a45-a8ee-cbcbcc5c4d4b'
    repository.listMovements.mockResolvedValue({
      items: [movement({ performedBy: operatorId })],
      total: 1,
    })
    repository.findUserDisplayNames.mockResolvedValue([
      { id: operatorId, displayName: 'Arian' },
    ])

    const result = await inventoryService.listMovements({
      page: 1,
      pageSize: 20,
    })

    expect(repository.findUserDisplayNames).toHaveBeenCalledWith([operatorId])
    expect(result.data[0]?.performedBy).toBe('Arian')
  })

  it('registra stock inicial, entrada y salida con actor y contexto', async () => {
    repository.registerMovement.mockResolvedValue(movement({ type: 'INITIAL' }))

    const result = await inventoryService.registerInitial(
      {
        productId: 'p1',
        quantity: 10,
        idempotencyKey: 'key-initial-1',
      },
      actor,
      context,
    )

    expect(repository.registerMovement).toHaveBeenCalledWith(
      {
        productId: 'p1',
        quantity: 10,
        idempotencyKey: 'key-initial-1',
      },
      'INITIAL',
      actor,
      context,
    )
    expect(result.data.type).toBe('INITIAL')

    repository.registerMovement.mockResolvedValue(movement())
    await inventoryService.registerEntry(
      {
        productId: 'p1',
        quantity: 5,
        idempotencyKey: 'key-entry-1',
      },
      actor,
      context,
    )
    expect(repository.registerMovement).toHaveBeenCalledWith(
      expect.any(Object),
      'ENTRY',
      actor,
      context,
    )

    await inventoryService.registerExit(
      {
        productId: 'p1',
        quantity: 3,
        idempotencyKey: 'key-exit-1',
      },
      actor,
      context,
    )
    expect(repository.registerMovement).toHaveBeenCalledWith(
      expect.any(Object),
      'EXIT',
      actor,
      context,
    )
  })

  it('resuelve el tipo del ajuste por el signo y normaliza la magnitud', async () => {
    repository.registerMovement.mockReset()
    repository.registerMovement.mockResolvedValue(movement())

    await inventoryService.registerAdjustment(
      {
        productId: 'p1',
        quantity: 6,
        idempotencyKey: 'key-adj-in-1',
      },
      actor,
      context,
    )
    expect(repository.registerMovement).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 6 }),
      'ADJUSTMENT_IN',
      actor,
      context,
    )

    await inventoryService.registerAdjustment(
      {
        productId: 'p1',
        quantity: -4,
        idempotencyKey: 'key-adj-out-1',
      },
      actor,
      context,
    )
    expect(repository.registerMovement).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4 }),
      'ADJUSTMENT_OUT',
      actor,
      context,
    )
  })

  it('reproduce una operación con la misma clave de idempotencia', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('Duplicado', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: { target: ['idempotency_key'] },
    })
    repository.registerMovement.mockRejectedValue(conflict)
    repository.findByKey.mockResolvedValue(movement())

    const result = await inventoryService.registerEntry(
      {
        productId: 'p1',
        quantity: 5,
        idempotencyKey: 'key-entry-retry',
      },
      actor,
      context,
    )

    expect(repository.findByKey).toHaveBeenCalledWith('key-entry-retry')
    expect(result.data.id).toBe('mov1')
  })

  it('informa un conflicto de idempotencia sin movimiento previo', async () => {
    repository.registerMovement.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    )
    repository.findByKey.mockResolvedValue(null)

    await expect(
      inventoryService.registerEntry(
        {
          productId: 'p1',
          quantity: 5,
          idempotencyKey: 'key-entry-race',
        },
        actor,
        context,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'INVENTORY_MOVEMENT_REJECTED',
    })
  })

  it('mapea referencias inválidas y productos inexistentes', async () => {
    repository.registerMovement.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK rota', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    )
    await expect(
      inventoryService.registerEntry(
        {
          productId: 'p1',
          quantity: 5,
          idempotencyKey: 'key-entry-fk',
        },
        actor,
        context,
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'PRODUCT_REFERENCE_INVALID',
    })

    repository.registerMovement.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No existe', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    )
    await expect(
      inventoryService.registerExit(
        {
          productId: 'p1',
          quantity: 3,
          idempotencyKey: 'key-exit-missing',
        },
        actor,
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  })

  it('propaga los errores de negocio como AppError', async () => {
    repository.registerMovement.mockRejectedValue(
      new AppError(409, 'INSUFFICIENT_STOCK', 'Stock insuficiente.'),
    )

    await expect(
      inventoryService.registerExit(
        {
          productId: 'p1',
          quantity: 99,
          idempotencyKey: 'key-exit-short',
        },
        actor,
        context,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'INSUFFICIENT_STOCK',
    })
  })
})
