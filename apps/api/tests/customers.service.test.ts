import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'
import { AppError } from '../src/shared/errors/app-error.js'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../src/modules/customers/customers.repository.js', () => ({
  customersRepository: repository,
}))

import { customersService } from '../src/modules/customers/customers.service.js'

const context = {
  requestId: 'req-1',
  ipAddress: '127.0.0.1',
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    type: 'NATURAL',
    documentNumber: '12345678',
    firstName: 'María',
    lastName: 'Pérez',
    legalName: null,
    phone: '987654321',
    email: null,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

describe('Servicio de clientes', () => {
  beforeEach(() => {
    repository.list.mockReset()
    repository.findById.mockReset()
    repository.create.mockReset()
    repository.update.mockReset()
  })

  it('lista clientes con la respuesta mapeada y paginación', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })

    const result = await customersService.list({
      search: 'maria',
      type: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      search: 'maria',
      type: 'all',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 'c1',
          type: 'NATURAL',
          documentNumber: '12345678',
          firstName: 'María',
          lastName: 'Pérez',
          legalName: null,
          phone: '987654321',
          email: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })
  })

  it('crea una persona natural y normaliza los campos del tipo', async () => {
    repository.create.mockResolvedValue(record())

    const result = await customersService.create(
      {
        type: 'NATURAL',
        documentNumber: '12345678',
        firstName: 'María',
        lastName: 'Pérez',
        phone: '987654321',
        email: 'maria@torcly.local',
      },
      'actor-1',
      context,
    )

    expect(repository.create).toHaveBeenCalledWith(
      {
        type: 'NATURAL',
        documentNumber: '12345678',
        firstName: 'María',
        lastName: 'Pérez',
        legalName: null,
        phone: '987654321',
        email: 'maria@torcly.local',
      },
      'actor-1',
      context,
    )
    expect(result.data.id).toBe('c1')
  })

  it('crea una persona jurídica y limpia los campos de persona natural', async () => {
    repository.create.mockResolvedValue(
      record({
        type: 'LEGAL',
        documentNumber: '20123456789',
        firstName: null,
        lastName: null,
        legalName: 'Torcly Repuestos S.A.C.',
      }),
    )

    await customersService.create(
      {
        type: 'LEGAL',
        documentNumber: '20123456789',
        legalName: 'Torcly Repuestos S.A.C.',
        phone: '+51987654321',
      },
      'actor-1',
      context,
    )

    expect(repository.create).toHaveBeenCalledWith(
      {
        type: 'LEGAL',
        documentNumber: '20123456789',
        firstName: null,
        lastName: null,
        legalName: 'Torcly Repuestos S.A.C.',
        phone: '+51987654321',
        email: null,
      },
      'actor-1',
      context,
    )
  })

  it('informa un cliente inexistente al actualizar', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      customersService.update(
        'c1',
        {
          type: 'NATURAL',
          documentNumber: '12345678',
          firstName: 'María',
          lastName: 'Pérez',
          phone: '987654321',
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'CUSTOMER_NOT_FOUND',
    })
  })

  it('mapea un documento duplicado a un error accionable', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      customersService.create(
        {
          type: 'LEGAL',
          documentNumber: '20123456789',
          legalName: 'Torcly Repuestos S.A.C.',
          phone: '987654321',
        },
        'actor-1',
        context,
      ),
    ).rejects.toBeInstanceOf(AppError)
    await expect(
      customersService.create(
        {
          type: 'LEGAL',
          documentNumber: '20123456789',
          legalName: 'Torcly Repuestos S.A.C.',
          phone: '987654321',
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'CUSTOMER_DOCUMENT_DUPLICATE',
    })
  })

  it('consulta el detalle y mapea las fechas', async () => {
    repository.findById.mockResolvedValue(record())

    const result = await customersService.getById('c1')
    expect(result.data.createdAt).toBe('2026-01-02T00:00:00.000Z')
    expect(repository.findById).toHaveBeenCalledWith('c1')
  })
})
