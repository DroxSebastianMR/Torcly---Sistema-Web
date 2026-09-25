import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { ServiceFilters, ServiceInput } from './services.types.js'

function auditEventForStatus(active: boolean): AuditEventType {
  return active ? 'SERVICE_ACTIVATED' : 'SERVICE_DEACTIVATED'
}

function auditData(
  event: AuditEventType,
  actorId: string,
  identifier: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

function serviceAuditMetadata(service: {
  id: string
  code: string
  name: string
  price: { toString(): string }
  active: boolean
}) {
  return {
    serviceId: service.id,
    code: service.code,
    name: service.name,
    price: Number(service.price),
    active: service.active,
  }
}

function buildWhere(filters: ServiceFilters): Prisma.ServiceWhereInput {
  const search = filters.search?.trim()

  return {
    ...(filters.status === 'active'
      ? { active: true }
      : filters.status === 'inactive'
        ? { active: false }
        : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
}

export const servicesRepository = {
  async list(filters: ServiceFilters) {
    const where = buildWhere(filters)
    return databaseService.transaction(async (transaction) => {
      const [items, total] = await Promise.all([
        transaction.service.findMany({
          where,
          orderBy: [{ active: 'desc' }, { name: 'asc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.service.count({ where }),
      ])
      return { items, total }
    })
  },

  findById(id: string) {
    return databaseService.client.service.findUnique({ where: { id } })
  },

  listActive() {
    return databaseService.client.service.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    })
  },

  create(input: ServiceInput, actorId: string, context: RequestContext) {
    return databaseService.transaction(async (transaction) => {
      const service = await transaction.service.create({ data: input })
      await transaction.auditLog.create({
        data: auditData(
          'SERVICE_CREATED',
          actorId,
          service.code,
          context,
          serviceAuditMetadata(service),
        ),
      })
      return service
    })
  },

  update(
    id: string,
    input: ServiceInput,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const service = await transaction.service.update({
        where: { id },
        data: input,
      })
      await transaction.auditLog.create({
        data: auditData(
          'SERVICE_UPDATED',
          actorId,
          service.code,
          context,
          serviceAuditMetadata(service),
        ),
      })
      return service
    })
  },

  updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const service = await transaction.service.update({
        where: { id },
        data: { active },
      })
      await transaction.auditLog.create({
        data: auditData(
          auditEventForStatus(active),
          actorId,
          service.code,
          context,
          serviceAuditMetadata(service),
        ),
      })
      return service
    })
  },
}

export type ServiceRecord = NonNullable<
  Awaited<ReturnType<typeof servicesRepository.findById>>
>
