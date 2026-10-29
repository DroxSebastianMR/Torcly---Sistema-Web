import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { TechnicianFilters, TechnicianInput } from './technicians.types.js'

const auditEvent = (active: boolean): AuditEventType =>
  active ? 'TECHNICIAN_ACTIVATED' : 'TECHNICIAN_DEACTIVATED'

function where(filters: TechnicianFilters): Prisma.TechnicianWhereInput {
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
  identifier,
  requestId: context.requestId,
  ipAddress: context.ipAddress,
  metadata: data,
})

export const techniciansRepository = {
  async list(filters: TechnicianFilters) {
    const criteria = where(filters)
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
  findById(id: string) {
    return databaseService.client.technician.findUnique({ where: { id } })
  },
  listActive() {
    return databaseService.client.technician.findMany({
      where: { active: true },
      select: { id: true, code: true, fullName: true },
      orderBy: { fullName: 'asc' },
    })
  },
  create(input: TechnicianInput, actorId: string, context: RequestContext) {
    return databaseService.transaction(async (tx) => {
      const sequence = await tx.$queryRaw<
        Array<{ value: bigint }>
      >`SELECT nextval('technicians_code_seq') AS value`
      const technician = await tx.technician.create({
        data: {
          ...input,
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
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const technician = await tx.technician.update({
        where: { id },
        data: { ...input, updatedBy: actorId },
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
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const technician = await tx.technician.update({
        where: { id },
        data: { active, updatedBy: actorId },
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
