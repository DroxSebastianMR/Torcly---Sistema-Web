import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  servicesRepository,
  type ServiceRecord,
} from './services.repository.js'
import type {
  ServiceFilters,
  ServiceInput,
  ServiceResponse,
} from './services.types.js'

function toResponse(service: ServiceRecord): ServiceResponse {
  return {
    id: service.id,
    code: service.code,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    active: service.active,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'SERVICE_DUPLICATE',
        'Ya existe un servicio con el mismo código.',
      )
    }

    if (error.code === 'P2025') {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Servicio no encontrado.')
    }
  }

  throw error
}

export const servicesService = {
  async list(filters: ServiceFilters, organizationId: string) {
    const result = await servicesRepository.list(filters, organizationId)
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

  async getById(id: string, organizationId: string) {
    const service = await servicesRepository.findById(id, organizationId)
    if (!service)
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Servicio no encontrado.')
    return { data: toResponse(service) }
  },

  async checkCodeAvailability(
    code: string,
    organizationId: string,
    excludeId?: string,
  ) {
    return {
      data: {
        code,
        available: await servicesRepository.isCodeAvailable(
          code,
          organizationId,
          excludeId,
        ),
      },
    }
  },

  async getOptions(organizationId: string) {
    return { data: await servicesRepository.listActive(organizationId) }
  },

  async create(
    input: ServiceInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await servicesRepository.create(
            input,
            actorId,
            organizationId,
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
    input: ServiceInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await servicesRepository.update(
            id,
            input,
            actorId,
            organizationId,
            context,
          ),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await servicesRepository.updateStatus(
            id,
            active,
            actorId,
            organizationId,
            context,
          ),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },
}
