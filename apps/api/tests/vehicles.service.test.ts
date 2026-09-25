import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'
import { AppError } from '../src/shared/errors/app-error.js'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  findCustomerById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../src/modules/vehicles/vehicles.repository.js', () => ({
  vehiclesRepository: repository,
}))

import { vehiclesService } from '../src/modules/vehicles/vehicles.service.js'

const context = {
  requestId: 'req-1',
  ipAddress: '127.0.0.1',
}

const OWNER = {
  id: 'c1',
  type: 'NATURAL',
  documentNumber: '12345678',
  firstName: 'María',
  lastName: 'Pérez',
  legalName: null,
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2021,
    customerId: 'c1',
    customer: OWNER,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

describe('Servicio de vehículos', () => {
  beforeEach(() => {
    repository.list.mockReset()
    repository.findById.mockReset()
    repository.findCustomerById.mockReset()
    repository.create.mockReset()
    repository.update.mockReset()
  })

  it('lista vehículos con propietario mapeado y paginación', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })

    const result = await vehiclesService.list({
      search: 'toyota',
      customerId: undefined,
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      search: 'toyota',
      customerId: undefined,
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 'v1',
          plate: 'ABC123',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2021,
          customerId: 'c1',
          owner: OWNER,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })
  })

  it('crea el vehículo normalizando la placa y verificando al propietario', async () => {
    repository.findCustomerById.mockResolvedValue(OWNER)
    repository.create.mockResolvedValue(record())

    const result = await vehiclesService.create(
      {
        plate: 'abc-123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        customerId: 'c1',
      },
      'actor-1',
      context,
    )

    expect(repository.findCustomerById).toHaveBeenCalledWith('c1')
    expect(repository.create).toHaveBeenCalledWith(
      {
        plate: 'ABC123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        customerId: 'c1',
      },
      'actor-1',
      context,
    )
    expect(result.data.plate).toBe('ABC123')
  })

  it('informa un propietario inexistente al crear', async () => {
    repository.findCustomerById.mockResolvedValue(null)

    await expect(
      vehiclesService.create(
        {
          plate: 'abc-123',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2021,
          customerId: 'c1',
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'CUSTOMER_NOT_FOUND',
    })
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('mapea una placa duplicada equivalente a un error accionable', async () => {
    repository.findCustomerById.mockResolvedValue(OWNER)
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      vehiclesService.create(
        {
          plate: 'ABC123',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2021,
          customerId: 'c1',
        },
        'actor-1',
        context,
      ),
    ).rejects.toBeInstanceOf(AppError)
    await expect(
      vehiclesService.create(
        {
          plate: 'ABC123',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2021,
          customerId: 'c1',
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'VEHICLE_PLATE_DUPLICATE',
    })
  })

  it('informa un vehículo inexistente al actualizar', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      vehiclesService.update(
        'v1',
        { plate: 'ABC123', brand: 'Toyota', model: 'Corolla', year: 2021 },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
    })
  })

  it('consulta el detalle y mapea las fechas y el propietario', async () => {
    repository.findById.mockResolvedValue(record())

    const result = await vehiclesService.getById('v1')
    expect(result.data.createdAt).toBe('2026-01-02T00:00:00.000Z')
    expect(result.data.owner.id).toBe('c1')
    expect(repository.findById).toHaveBeenCalledWith('v1')
  })
})
