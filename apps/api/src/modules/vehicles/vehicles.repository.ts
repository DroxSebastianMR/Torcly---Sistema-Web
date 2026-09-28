import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { VehicleListFilters } from './vehicles.types.js'
import { normalizePlate } from './vehicles.utils.js'

const findUniqueInclude = {
  customer: {
    select: {
      id: true,
      type: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
    },
  },
} satisfies Prisma.VehicleInclude

function auditData(
  event: AuditEventType,
  actorId: string,
  plate: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    identifier: plate,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

function buildWhere(filters: VehicleListFilters): Prisma.VehicleWhereInput {
  const search = filters.search?.trim()
  const ownerTerms = search?.split(/\s+/).filter(Boolean) ?? []

  return {
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(search
      ? {
          OR: [
            { plate: { contains: normalizePlate(search) } },
            {
              customer: {
                AND: ownerTerms.map((term) => ({
                  OR: [
                    {
                      documentNumber: {
                        contains: term,
                        mode: 'insensitive',
                      },
                    },
                    { firstName: { contains: term, mode: 'insensitive' } },
                    { lastName: { contains: term, mode: 'insensitive' } },
                    { legalName: { contains: term, mode: 'insensitive' } },
                  ],
                })),
              },
            },
          ],
        }
      : {}),
  }
}

export const vehiclesRepository = {
  async list(filters: VehicleListFilters) {
    const where = buildWhere(filters)
    const [items, total] = await databaseService.transaction(
      async (transaction) =>
        Promise.all([
          transaction.vehicle.findMany({
            where,
            include: findUniqueInclude,
            orderBy: { updatedAt: 'desc' },
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
          }),
          transaction.vehicle.count({ where }),
        ]),
    )

    return { items, total }
  },

  findById(id: string) {
    return databaseService.client.vehicle.findUnique({
      where: { id },
      include: findUniqueInclude,
    })
  },

  findCustomerById(id: string) {
    return databaseService.client.customer.findUnique({ where: { id } })
  },

  create(
    input: Prisma.VehicleUncheckedCreateInput,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const vehicle = await transaction.vehicle.create({
        data: input,
        include: findUniqueInclude,
      })
      await transaction.auditLog.create({
        data: auditData('VEHICLE_CREATED', actorId, vehicle.plate, context, {
          vehicleId: vehicle.id,
          customerId: vehicle.customerId,
        }),
      })
      return vehicle
    })
  },

  update(
    id: string,
    input: Prisma.VehicleUncheckedUpdateInput,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const vehicle = await transaction.vehicle.update({
        where: { id },
        data: input,
        include: findUniqueInclude,
      })
      await transaction.auditLog.create({
        data: auditData('VEHICLE_UPDATED', actorId, vehicle.plate, context, {
          vehicleId: vehicle.id,
          customerId: vehicle.customerId,
        }),
      })
      return vehicle
    })
  },
}

export type VehicleRecord = NonNullable<
  Awaited<ReturnType<typeof vehiclesRepository.findById>>
>
