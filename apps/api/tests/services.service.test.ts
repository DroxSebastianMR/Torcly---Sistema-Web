import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  listActive: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
}))

vi.mock('../src/modules/services/services.repository.js', () => ({
  servicesRepository: repository,
}))

import { servicesService } from '../src/modules/services/services.service.js'

const context = {
  requestId: 'req-srv-1',
  ipAddress: '127.0.0.1',
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    code: 'CAMBIO-ACEITE',
    name: 'Cambio de aceite',
    description: null,
    price: 35.5,
    active: true,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

const input = {
  code: 'CAMBIO-ACEITE',
  name: 'Cambio de aceite',
  description: null,
  price: 35.5,
}

describe('Servicio de servicios', () => {
  beforeEach(() => {
    for (const mock of Object.values(repository)) mock.mockReset()
  })

  it('lista servicios con estado y paginación', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })

    const result = await servicesService.list({
      search: 'aceite',
      status: 'active',
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      search: 'aceite',
      status: 'active',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 's1',
          code: 'CAMBIO-ACEITE',
          name: 'Cambio de aceite',
          description: null,
          price: 35.5,
          active: true,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })
  })

  it('informa un servicio inexistente en el detalle', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(servicesService.getById('s1')).rejects.toMatchObject({
      status: 404,
      code: 'SERVICE_NOT_FOUND',
    })
  })

  it('consume el detalle y expone solo servicios activos en opciones', async () => {
    repository.findById.mockResolvedValue(record())
    repository.listActive.mockResolvedValue([
      { id: 's1', code: 'CAMBIO-ACEITE', name: 'Cambio de aceite' },
    ])

    const detail = await servicesService.getById('s1')
    expect(detail.data.code).toBe('CAMBIO-ACEITE')

    const options = await servicesService.getOptions()
    expect(options.data).toEqual([
      { id: 's1', code: 'CAMBIO-ACEITE', name: 'Cambio de aceite' },
    ])
  })

  it('crea, actualiza y cambia el estado auditando con actor y contexto', async () => {
    repository.create.mockResolvedValue(record())
    await servicesService.create(input, 'actor-1', context)
    expect(repository.create).toHaveBeenCalledWith(input, 'actor-1', context)

    repository.update.mockResolvedValue(record({ price: 42 }))
    const updated = await servicesService.update(
      's1',
      { ...input, price: 42 },
      'actor-1',
      context,
    )
    expect(repository.update).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ price: 42 }),
      'actor-1',
      context,
    )
    expect(updated.data.price).toBe(42)

    repository.updateStatus.mockResolvedValue(record({ active: false }))
    await servicesService.updateStatus('s1', false, 'actor-1', context)
    expect(repository.updateStatus).toHaveBeenCalledWith(
      's1',
      false,
      'actor-1',
      context,
    )
  })

  it('mapea un código duplicado a un error accionable', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      servicesService.create(input, 'actor-1', context),
    ).rejects.toMatchObject({
      status: 409,
      code: 'SERVICE_DUPLICATE',
    })
  })

  it('informa inexistencia al actualizar y desactivar', async () => {
    repository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No existe', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    )
    await expect(
      servicesService.update('s1', input, 'actor-1', context),
    ).rejects.toMatchObject({
      status: 404,
      code: 'SERVICE_NOT_FOUND',
    })

    repository.updateStatus.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No existe', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    )
    await expect(
      servicesService.updateStatus('s1', false, 'actor-1', context),
    ).rejects.toMatchObject({
      status: 404,
      code: 'SERVICE_NOT_FOUND',
    })
  })
})
