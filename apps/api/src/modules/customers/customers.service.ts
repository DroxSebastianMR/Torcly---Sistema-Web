import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  customersRepository,
  type CustomerRecord,
} from './customers.repository.js'
import type {
  CreateCustomerInput,
  CustomerIdentity,
  CustomerListFilters,
  UpdateCustomerInput,
} from './customers.types.js'

function toResponse(customer: CustomerRecord): CustomerIdentity {
  return {
    id: customer.id,
    type: customer.type,
    documentNumber: customer.documentNumber,
    firstName: customer.firstName,
    lastName: customer.lastName,
    legalName: customer.legalName,
    phone: customer.phone,
    email: customer.email,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }
}

function normalizeFields(
  input: CreateCustomerInput,
): Prisma.CustomerUncheckedCreateInput {
  if (input.type === 'NATURAL') {
    return {
      type: 'NATURAL',
      documentNumber: input.documentNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      legalName: null,
      phone: input.phone,
      email: input.email ?? null,
    }
  }

  return {
    type: 'LEGAL',
    documentNumber: input.documentNumber,
    legalName: input.legalName,
    firstName: null,
    lastName: null,
    phone: input.phone,
    email: input.email ?? null,
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'CUSTOMER_DOCUMENT_DUPLICATE',
        'Ya existe un cliente con ese documento.',
      )
    }

    if (error.code === 'P2025') {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')
    }
  }

  throw error
}

async function assertCustomerExists(id: string) {
  const customer = await customersRepository.findById(id)
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')
  }
  return customer
}

export const customersService = {
  async list(filters: CustomerListFilters) {
    const result = await customersRepository.list(filters)
    return {
      data: result.items.map(toResponse),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },

  async getById(id: string) {
    return { data: toResponse(await assertCustomerExists(id)) }
  },

  async create(
    input: CreateCustomerInput,
    actorId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await customersRepository.create(
            normalizeFields(input),
            actorId,
            context,
          ),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async update(
    id: string,
    input: UpdateCustomerInput,
    actorId: string,
    context: RequestContext,
  ) {
    await assertCustomerExists(id)

    try {
      return {
        data: toResponse(
          await customersRepository.update(
            id,
            normalizeFields(input),
            actorId,
            context,
          ),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },
}
