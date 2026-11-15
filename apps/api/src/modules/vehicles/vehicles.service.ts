import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  vehiclesRepository,
  type VehicleRecord,
} from './vehicles.repository.js'
import type {
  VehicleCreateInput,
  VehicleHistoryPartLine,
  VehicleHistoryResponse,
  VehicleHistoryServiceLine,
  VehicleHistoryTimelineEntry,
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

    if (error.code === 'P2003') {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Cliente no encontrado.')
    }
  }

  throw error
}

async function assertVehicleExists(id: string, organizationId: string) {
  const vehicle = await vehiclesRepository.findById(id, organizationId)
  if (!vehicle) {
    throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado.')
  }
  return vehicle
}

export const vehiclesService = {
  async list(
    filters: VehicleListFilters,
    organizationId: string,
  ): Promise<VehicleListResponse> {
    const result = await vehiclesRepository.list(filters, organizationId)
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
    return { data: toResponse(await assertVehicleExists(id, organizationId)) }
  },

  async getHistory(
    id: string,
    organizationId: string,
  ): Promise<{ data: VehicleHistoryResponse }> {
    const vehicle = await vehiclesRepository.getHistory(id, organizationId)
    if (!vehicle) {
      throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado.')
    }

    const totalVisits = vehicle.workOrders.length
    let totalSpent = 0
    let lastMileage: number | null = vehicle.mileage ?? null
    let lastVisitAt: string | null = null

    if (vehicle.workOrders.length > 0) {
      lastVisitAt = vehicle.workOrders[0].createdAt.toISOString()
      for (const order of vehicle.workOrders) {
        totalSpent += Number(order.total)
        if (
          order.currentMileage !== null &&
          order.currentMileage !== undefined
        ) {
          if (lastMileage === null || order.currentMileage > lastMileage) {
            lastMileage = order.currentMileage
          }
        }
      }
    }

    const timeline: VehicleHistoryTimelineEntry[] = vehicle.workOrders.map(
      (order) => {
        const services: VehicleHistoryServiceLine[] = []
        const parts: VehicleHistoryPartLine[] = []

        for (const line of order.lines) {
          if (line.type === 'SERVICE') {
            services.push({
              id: line.id,
              name: line.name,
              code: line.code,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
              subtotal: Number(line.subtotal),
            })
          } else {
            parts.push({
              id: line.id,
              name: line.name,
              code: line.code,
              unitLabel: line.unitLabel,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
              subtotal: Number(line.subtotal),
            })
          }
        }

        return {
          id: order.id,
          code: order.code,
          status: order.status,
          source: order.source,
          entryDate: order.createdAt.toISOString(),
          deliveredDate: order.deliveredAt?.toISOString() ?? null,
          mileage: order.currentMileage,
          fuelLevel: order.fuelLevel,
          diagnosis: order.diagnosis,
          receptionNotes: order.receptionNotes,
          technician: order.technician
            ? {
                id: order.technician.id,
                fullName: order.technician.fullName,
              }
            : null,
          services,
          parts,
          total: Number(order.total),
        }
      },
    )

    return {
      data: {
        vehicle: toResponse(vehicle),
        summary: {
          totalVisits,
          totalSpent: Math.round(totalSpent * 100) / 100,
          lastMileage,
          lastVisitAt,
        },
        timeline,
      },
    }
  },

  async create(
    input: VehicleCreateInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await vehiclesRepository.create(
            { ...input, organizationId, plate: normalizePlate(input.plate) },
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
    input: VehicleUpdateInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await vehiclesRepository.update(
            id,
            { ...input, plate: normalizePlate(input.plate) },
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
