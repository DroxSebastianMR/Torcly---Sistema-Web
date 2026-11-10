import {
  type AuditEventType,
  type CustomerType,
  type Vehicle,
  Prisma,
} from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { CustomerListFilters, CustomerVehicleInput } from './customers.types.js'

function auditData(
  event: AuditEventType,
  actorId: string,
  documentNumber: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    organizationId: context.organizationId,
    identifier: documentNumber,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

function buildWhere(
  filters: CustomerListFilters,
  organizationId: string,
): Prisma.CustomerWhereInput {
  const search = filters.search?.trim()
  const isDocumentSearch = Boolean(search && /^\d+$/.test(search))

  return {
    organizationId,
    ...(filters.type === 'all' ? {} : { type: filters.type as CustomerType }),
    ...(isDocumentSearch
      ? { documentNumber: search }
      : search
        ? {
            OR: [
              { documentNumber: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { legalName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
  }
}

export const customersRepository = {
  async list(filters: CustomerListFilters, organizationId: string) {
    const where = buildWhere(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.measure('customers.list.records', () =>
        databaseService.client.customer.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      databaseService.measure('customers.list.total', () =>
        databaseService.client.customer.count({ where }),
      ),
    ])

    return { items, total }
  },

  findById(id: string, organizationId: string) {
    return databaseService.client.customer.findFirst({
      where: { id, organizationId },
    })
  },

  create(
    input: Prisma.CustomerUncheckedCreateInput,
    actorId: string,
    context: RequestContext,
    vehicleInput?: CustomerVehicleInput | null,
  ) {
    return databaseService.transaction(async (transaction) => {
      const customer = await databaseService.measure(
        'customers.create.record',
        () => transaction.customer.create({ data: input }),
      )
      await databaseService.measure('customers.create.audit', () =>
        transaction.auditLog.create({
          data: auditData(
            'CUSTOMER_CREATED',
            actorId,
            customer.documentNumber,
            context,
            { customerId: customer.id },
          ),
        }),
      )

      let createdVehicle: Vehicle | null = null
      if (vehicleInput) {
        createdVehicle = await databaseService.measure(
          'customers.create.vehicle',
          () =>
            transaction.vehicle.create({
              data: {
                organizationId: input.organizationId,
                customerId: customer.id,
                plate: vehicleInput.plate,
                brand: vehicleInput.brand,
                model: vehicleInput.model,
                year: vehicleInput.year,
                mileage: vehicleInput.mileage ?? null,
              },
            }),
        )
        await databaseService.measure('customers.create.vehicle_audit', () =>
          transaction.auditLog.create({
            data: {
              event: 'VEHICLE_CREATED',
              userId: actorId,
              organizationId: input.organizationId,
              identifier: createdVehicle!.plate,
              requestId: context.requestId,
              ipAddress: context.ipAddress,
              metadata: {
                vehicleId: createdVehicle!.id,
                customerId: customer.id,
                source: 'ATOMIC_CUSTOMER_REGISTRATION',
              },
            },
          }),
        )
      }

      return { customer, createdVehicle }
    })
  },

  update(
    id: string,
    input: Prisma.CustomerUncheckedUpdateInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const result = await databaseService.measure(
        'customers.update.record',
        () =>
          transaction.customer.updateMany({
            where: { id, organizationId },
            data: input,
          }),
      )
      if (result.count === 0) {
        throw new Prisma.PrismaClientKnownRequestError('Customer not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const customer = await transaction.customer.findFirstOrThrow({
        where: { id, organizationId },
      })
      await databaseService.measure('customers.update.audit', () =>
        transaction.auditLog.create({
          data: auditData(
            'CUSTOMER_UPDATED',
            actorId,
            customer.documentNumber,
            context,
            { customerId: customer.id },
          ),
        }),
      )
      return customer
    })
  },
}

export type CustomerRecord = NonNullable<
  Awaited<ReturnType<typeof customersRepository.findById>>
>
