import { type AuditEventType, Prisma } from '../../generated/prisma/client.js'
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
    organizationId: context.organizationId,
    identifier: plate,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

function buildWhere(
  filters: VehicleListFilters,
  organizationId: string,
): Prisma.VehicleWhereInput {
  const search = filters.search?.trim()
  const ownerTerms = search?.split(/\s+/).filter(Boolean) ?? []

  return {
    organizationId,
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
  async list(filters: VehicleListFilters, organizationId: string) {
    const where = buildWhere(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.measure('vehicles.list.records', () =>
        databaseService.client.vehicle.findMany({
          where,
          include: findUniqueInclude,
          orderBy: { updatedAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      databaseService.measure('vehicles.list.total', () =>
        databaseService.client.vehicle.count({ where }),
      ),
    ])

    return { items, total }
  },

  findById(id: string, organizationId: string) {
    return databaseService.client.vehicle.findFirst({
      where: { id, organizationId },
      include: findUniqueInclude,
    })
  },

  findCustomerById(id: string, organizationId: string) {
    return databaseService.client.customer.findFirst({
      where: { id, organizationId },
    })
  },

  create(
    input: Prisma.VehicleUncheckedCreateInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        where: { id: input.customerId, organizationId },
      })
      if (!customer) {
        throw new Prisma.PrismaClientKnownRequestError('Customer not found', {
          code: 'P2003',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const vehicle = await databaseService.measure(
        'vehicles.create.record',
        () =>
          transaction.vehicle.create({
            data: input,
            include: findUniqueInclude,
          }),
      )
      await databaseService.measure('vehicles.create.audit', () =>
        transaction.auditLog.create({
          data: auditData('VEHICLE_CREATED', actorId, vehicle.plate, context, {
            vehicleId: vehicle.id,
            customerId: vehicle.customerId,
          }),
        }),
      )
      return vehicle
    })
  },

  update(
    id: string,
    input: Prisma.VehicleUncheckedUpdateInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      if (input.customerId) {
        const customer = await transaction.customer.findFirst({
          where: { id: String(input.customerId), organizationId },
        })
        if (!customer) {
          throw new Prisma.PrismaClientKnownRequestError('Customer not found', {
            code: 'P2003',
            clientVersion: Prisma.prismaVersion.client,
          })
        }
      }
      const result = await databaseService.measure(
        'vehicles.update.record',
        () =>
          transaction.vehicle.updateMany({
            where: { id, organizationId },
            data: input,
          }),
      )
      if (result.count === 0) {
        throw new Prisma.PrismaClientKnownRequestError('Vehicle not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const vehicle = await transaction.vehicle.findFirstOrThrow({
        where: { id, organizationId },
        include: findUniqueInclude,
      })
      await databaseService.measure('vehicles.update.audit', () =>
        transaction.auditLog.create({
          data: auditData('VEHICLE_UPDATED', actorId, vehicle.plate, context, {
            vehicleId: vehicle.id,
            customerId: vehicle.customerId,
          }),
        }),
      )
      return vehicle
    })
  },
}

export type VehicleRecord = NonNullable<
  Awaited<ReturnType<typeof vehiclesRepository.findById>>
>
