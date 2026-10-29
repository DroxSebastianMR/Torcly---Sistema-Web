import type {
  AuditEventType,
  CustomerType,
  Prisma,
} from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { CustomerListFilters } from './customers.types.js'

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
    identifier: documentNumber,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

function buildWhere(filters: CustomerListFilters): Prisma.CustomerWhereInput {
  const search = filters.search?.trim()
  const isDocumentSearch = Boolean(search && /^\d+$/.test(search))

  return {
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
  async list(filters: CustomerListFilters) {
    const where = buildWhere(filters)
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

  findById(id: string) {
    return databaseService.client.customer.findUnique({ where: { id } })
  },

  create(
    input: Prisma.CustomerUncheckedCreateInput,
    actorId: string,
    context: RequestContext,
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
      return customer
    })
  },

  update(
    id: string,
    input: Prisma.CustomerUncheckedUpdateInput,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const customer = await databaseService.measure(
        'customers.update.record',
        () =>
          transaction.customer.update({
            where: { id },
            data: input,
          }),
      )
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
