import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { UserListFilters } from './users.types.js'

const userRolesInclude = {
  roles: {
    where: { role: { active: true } },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: { select: { code: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude

const userInclude = { include: userRolesInclude } as const

function auditData(
  event: AuditEventType,
  targetUserId: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: targetUserId,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

function buildWhere(filters: UserListFilters): Prisma.UserWhereInput {
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
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
}

export const usersRepository = {
  async list(filters: UserListFilters) {
    const where = buildWhere(filters)
    const [items, total] = await databaseService.transaction(
      async (transaction) =>
        Promise.all([
          transaction.user.findMany({
            ...userInclude,
            where,
            orderBy: [{ active: 'desc' }, { displayName: 'asc' }],
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
          }),
          transaction.user.count({ where }),
        ]),
    )

    return { items, total }
  },

  findById(id: string) {
    return databaseService.client.user.findUnique({
      ...userInclude,
      where: { id },
    })
  },

  findActiveRoleById(roleId: string) {
    return databaseService.client.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: { select: { code: true } } },
        },
      },
    })
  },

  create(
    input: {
      username: string
      email: string
      displayName: string
      passwordHash: string
      roleId: string
    },
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          username: input.username,
          email: input.email,
          displayName: input.displayName,
          passwordHash: input.passwordHash,
          roles: { create: { roleId: input.roleId } },
        },
        include: userRolesInclude,
      })
      await transaction.auditLog.create({
        data: auditData('USER_CREATED', user.id, context),
      })
      return user
    })
  },

  update(
    id: string,
    input: { email: string; displayName: string },
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id },
        data: { email: input.email, displayName: input.displayName },
        include: userRolesInclude,
      })
      await transaction.auditLog.create({
        data: auditData('USER_UPDATED', user.id, context),
      })
      return user
    })
  },

  updateRole(
    id: string,
    roleId: string,
    context: RequestContext,
    metadata: { fromRoleCode?: string; toRoleCode: string },
  ) {
    return databaseService.transaction(async (transaction) => {
      await transaction.userRole.deleteMany({ where: { userId: id } })
      await transaction.userRole.create({ data: { userId: id, roleId } })
      const user = await transaction.user.findUniqueOrThrow({
        where: { id },
        include: userRolesInclude,
      })
      await transaction.auditLog.create({
        data: auditData('USER_ROLE_CHANGED', user.id, context, metadata),
      })
      return user
    })
  },

  updateStatus(id: string, active: boolean, context: RequestContext) {
    const now = new Date()
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id },
        data: { active },
        include: userRolesInclude,
      })
      if (!active) {
        await transaction.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: now },
        })
      }
      await transaction.auditLog.create({
        data: auditData(
          active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          user.id,
          context,
        ),
      })
      return user
    })
  },

  async listRoles() {
    const roles = await databaseService.client.role.findMany({
      where: { active: true },
      include: {
        permissions: {
          include: { permission: { select: { code: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      permissions: role.permissions.map(({ permission }) => permission.code),
    }))
  },
}

export type UserRecord = NonNullable<
  Awaited<ReturnType<typeof usersRepository.findById>>
>
