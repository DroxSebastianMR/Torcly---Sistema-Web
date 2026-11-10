import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'
import { AppError } from '../src/shared/errors/app-error.js'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  findCustomerById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  getHistory: vi.fn(),
}))

vi.mock('../src/modules/vehicles/vehicles.repository.js', () => ({
  vehiclesRepository: repository,
}))

import { vehiclesService } from '../src/modules/vehicles/vehicles.service.js'

const context = {
  requestId: 'req-1',
  ipAddress: '127.0.0.1',
}
const organizationId = 'organization-1'

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
    repository.getHistory.mockReset()
  })

  it('lista vehículos con propietario mapeado y paginación', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })

    const result = await vehiclesService.list(
      {
        search: 'toyota',
        customerId: undefined,
        page: 1,
        pageSize: 20,
      },
      organizationId,
    )

    expect(repository.list).toHaveBeenCalledWith(
      {
        search: 'toyota',
        customerId: undefined,
        page: 1,
        pageSize: 20,
      },
      organizationId,
    )
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

  it('crea el vehículo normalizando la placa', async () => {
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
      organizationId,
      context,
    )

    expect(repository.create).toHaveBeenCalledWith(
      {
        plate: 'ABC123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        customerId: 'c1',
        organizationId,
      },
      'actor-1',
      organizationId,
      context,
    )
    expect(result.data.plate).toBe('ABC123')
  })

  it('informa un propietario inexistente al crear', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Propietario inexistente', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    )

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
        organizationId,
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'CUSTOMER_NOT_FOUND',
    })
    expect(repository.create).toHaveBeenCalledOnce()
  })

  it('mapea una placa duplicada equivalente a un error accionable', async () => {
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
        organizationId,
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
        organizationId,
        context,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'VEHICLE_PLATE_DUPLICATE',
    })
  })

  it('informa un vehículo inexistente al actualizar', async () => {
    repository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Vehículo inexistente', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      vehiclesService.update(
        'v1',
        { plate: 'ABC123', brand: 'Toyota', model: 'Corolla', year: 2021 },
        'actor-1',
        organizationId,
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
    })
  })

  it('consulta el detalle y mapea las fechas y el propietario', async () => {
    repository.findById.mockResolvedValue(record())

    const result = await vehiclesService.getById('v1', organizationId)
    expect(result.data.createdAt).toBe('2026-01-02T00:00:00.000Z')
    expect(result.data.owner.id).toBe('c1')
    expect(repository.findById).toHaveBeenCalledWith('v1', organizationId)
  })

  it('obtiene el historial clínico vehicular con resumen y timeline detallado', async () => {
    repository.getHistory.mockResolvedValue({
      ...record(),
      workOrders: [
        {
          id: 'wo-1',
          code: 'OT-000001',
          status: 'ENTREGADA',
          source: 'DIRECT',
          currentMileage: 50000,
          fuelLevel: 'HALF',
          diagnosis: 'Mantenimiento preventivo 50k',
          receptionNotes: 'Vehículo en buen estado',
          total: 350.5,
          createdAt: new Date('2026-03-01T10:00:00.000Z'),
          deliveredAt: new Date('2026-03-01T15:00:00.000Z'),
          technician: {
            id: 'tech-1',
            fullName: 'Carlos Mecánico',
          },
          lines: [
            {
              id: 'line-1',
              type: 'SERVICE',
              name: 'Cambio de aceite y filtro',
              code: 'SRV-001',
              unitLabel: null,
              quantity: 1,
              unitPrice: 120,
              subtotal: 120,
            },
            {
              id: 'line-2',
              type: 'PRODUCT',
              name: 'Filtro de Aceite Bosch',
              code: 'PRD-001',
              unitLabel: 'UND',
              quantity: 1,
              unitPrice: 45.5,
              subtotal: 45.5,
            },
            {
              id: 'line-3',
              type: 'PRODUCT',
              name: 'Aceite Sintético 5W-30',
              code: 'PRD-002',
              unitLabel: 'GL',
              quantity: 1,
              unitPrice: 185,
              subtotal: 185,
            },
          ],
        },
      ],
    })

    const result = await vehiclesService.getHistory('v1', organizationId)

    expect(repository.getHistory).toHaveBeenCalledWith('v1', organizationId)
    expect(result.data.summary).toEqual({
      totalVisits: 1,
      totalSpent: 350.5,
      lastMileage: 50000,
      lastVisitAt: '2026-03-01T10:00:00.000Z',
    })
    expect(result.data.timeline).toHaveLength(1)
    expect(result.data.timeline[0].code).toBe('OT-000001')
    expect(result.data.timeline[0].technician?.fullName).toBe('Carlos Mecánico')
    expect(result.data.timeline[0].services).toHaveLength(1)
    expect(result.data.timeline[0].services[0].name).toBe('Cambio de aceite y filtro')
    expect(result.data.timeline[0].parts).toHaveLength(2)
    expect(result.data.timeline[0].parts[0].name).toBe('Filtro de Aceite Bosch')
  })

  it('lanza 404 si el vehículo no existe para consultar historial', async () => {
    repository.getHistory.mockResolvedValue(null)

    await expect(
      vehiclesService.getHistory('v-inexistente', organizationId),
    ).rejects.toMatchObject({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
    })
  })
})
