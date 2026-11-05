import { type AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { TechnicianFilters, TechnicianInput } from './technicians.types.js'

const auditEvent = (active: boolean): AuditEventType =>
  active ? 'TECHNICIAN_ACTIVATED' : 'TECHNICIAN_DEACTIVATED'

function where(
  filters: TechnicianFilters,
  organizationId: string,
): Prisma.TechnicianWhereInput {
  const search = filters.search?.trim()
  return {
    organizationId,
    ...(filters.status === 'active'
      ? { active: true }
      : filters.status === 'inactive'
        ? { active: false }
        : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { document: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
}

const metadata = (technician: {
  id: string
  code: string
  fullName: string
  active: boolean
}) =>
  ({
    technicianId: technician.id,
    code: technician.code,
    fullName: technician.fullName,
    active: technician.active,
  }) as Prisma.InputJsonValue

const audit = (
  event: AuditEventType,
  actorId: string,
  identifier: string,
  context: RequestContext,
  data: Prisma.InputJsonValue,
) => ({
  event,
  userId: actorId,
  organizationId: context.organizationId,
  identifier,
  requestId: context.requestId,
  ipAddress: context.ipAddress,
  metadata: data,
})

export const techniciansRepository = {
  async list(filters: TechnicianFilters, organizationId: string) {
    const criteria = where(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.measure('technicians.list.records', () =>
        databaseService.client.technician.findMany({
          where: criteria,
          orderBy: [{ active: 'desc' }, { fullName: 'asc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      databaseService.measure('technicians.list.total', () =>
        databaseService.client.technician.count({ where: criteria }),
      ),
    ])
    return { items, total }
  },
  findById(id: string, organizationId: string) {
    return databaseService.client.technician.findFirst({
      where: { id, organizationId },
    })
  },
  listActive(organizationId: string) {
    return databaseService.client.technician.findMany({
      where: { active: true, organizationId },
      select: { id: true, code: true, fullName: true },
      orderBy: { fullName: 'asc' },
    })
  },
  create(
    input: TechnicianInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const sequence = await tx.$queryRaw<
        Array<{ value: bigint }>
      >`SELECT nextval('technicians_code_seq') AS value`
      const technician = await tx.technician.create({
        data: {
          ...input,
          organizationId,
          code: `TEC-${String(sequence[0].value).padStart(6, '0')}`,
          createdBy: actorId,
          updatedBy: actorId,
        },
      })
      await tx.auditLog.create({
        data: audit(
          'TECHNICIAN_CREATED',
          actorId,
          technician.code,
          context,
          metadata(technician),
        ),
      })
      return technician
    })
  },
  update(
    id: string,
    input: TechnicianInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const result = await tx.technician.updateMany({
        where: { id, organizationId },
        data: { ...input, updatedBy: actorId },
      })
      if (result.count === 0) {
        throw new Prisma.PrismaClientKnownRequestError('Technician not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const technician = await tx.technician.findFirstOrThrow({
        where: { id, organizationId },
      })
      await tx.auditLog.create({
        data: audit(
          'TECHNICIAN_UPDATED',
          actorId,
          technician.code,
          context,
          metadata(technician),
        ),
      })
      return technician
    })
  },
  updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const result = await tx.technician.updateMany({
        where: { id, organizationId },
        data: { active, updatedBy: actorId },
      })
      if (result.count === 0) {
        throw new Prisma.PrismaClientKnownRequestError('Technician not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const technician = await tx.technician.findFirstOrThrow({
        where: { id, organizationId },
      })
      await tx.auditLog.create({
        data: audit(
          auditEvent(active),
          actorId,
          technician.code,
          context,
          metadata(technician),
        ),
      })
      return technician
    })
  },
}

export type TechnicianRecord = NonNullable<
  Awaited<ReturnType<typeof techniciansRepository.findById>>
>
