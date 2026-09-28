import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  vehiclesRepository,
  type VehicleRecord,
} from './vehicles.repository.js'
import type {
  VehicleCreateInput,
  VehicleIdentity,
  VehicleListFilters,
  VehicleListResponse,
  VehicleUpdateInput,
} from './vehicles.types.js'
import { normalizePlate } from './vehicles.utils.js'

function toResponse(vehicle: VehicleRecord): VehicleIdentity {
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    customerId: vehicle.customerId,
    owner: {
      id: vehicle.customer.id,
      type: vehicle.customer.type,
      documentNumber: vehicle.customer.documentNumber,
      firstName: vehicle.customer.firstName,
      lastName: vehicle.customer.lastName,
      legalName: vehicle.customer.legalName,
    },
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'VEHICLE_PLATE_DUPLICATE',
        'Ya existe un vehículo con esa placa.',
      )
    }

    if (error.code === 'P2025') {
      throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado.')
    }
  }

  throw error
}

async function assertVehicleExists(id: string) {
  const vehicle = await vehiclesRepository.findById(id)
  if (!vehicle) {
    throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado.')
  }
  return vehicle
}

export const vehiclesService = {
  async list(filters: VehicleListFilters): Promise<VehicleListResponse> {
    const result = await vehiclesRepository.list(filters)
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
    return { data: toResponse(await assertVehicleExists(id)) }
  },

  async create(
    input: VehicleCreateInput,
    actorId: string,
    context: RequestContext,
  ) {
    const customer = await vehiclesRepository.findCustomerById(input.customerId)
    if (!customer) {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')
    }

    try {
      return {
        data: toResponse(
          await vehiclesRepository.create(
            { ...input, plate: normalizePlate(input.plate) },
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
    input: VehicleUpdateInput,
    actorId: string,
    context: RequestContext,
  ) {
    await assertVehicleExists(id)

    try {
      return {
        data: toResponse(
          await vehiclesRepository.update(
            id,
            { ...input, plate: normalizePlate(input.plate) },
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
