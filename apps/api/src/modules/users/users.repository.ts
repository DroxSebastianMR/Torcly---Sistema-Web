import { Prisma, type AuditEventType } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { UserListFilters } from './users.types.js'

function userMembershipInclude(organizationId: string) {
  return {
    organizationMemberships: {
      where: { organizationId, active: true, role: { active: true } },
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
}

function userInclude(organizationId: string) {
  return { include: userMembershipInclude(organizationId) } as const
}

const roleInclude = {
  permissions: {
    include: { permission: { select: { code: true } } },
  },
} satisfies Prisma.RoleInclude

function organizationWhere(organizationId: string): Prisma.UserWhereInput {
  return {
    organizationMemberships: { some: { organizationId, active: true } },
  }
}

function buildWhere(
  filters: UserListFilters,
  organizationId: string,
): Prisma.UserWhereInput {
  const search = filters.search?.trim()

  return {
    ...organizationWhere(organizationId),
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

function auditData(
  event: AuditEventType,
  targetUserId: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: targetUserId,
    organizationId: context.organizationId,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

export const usersRepository = {
  async list(filters: UserListFilters, organizationId: string) {
    const where = buildWhere(filters, organizationId)
    const [items, total] = await Promise.all([
      databaseService.client.user.findMany({
        ...userInclude(organizationId),
        where,
        orderBy: [{ active: 'desc' }, { displayName: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.user.count({ where }),
    ])

    return { items, total }
  },

  findById(id: string, organizationId: string) {
    return databaseService.client.user.findFirst({
      ...userInclude(organizationId),
      where: { id, ...organizationWhere(organizationId) },
    })
  },

  findActiveRoleById(roleId: string) {
    return databaseService.client.role.findUnique({
      where: { id: roleId },
      include: roleInclude,
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
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          username: input.username,
          email: input.email,
          displayName: input.displayName,
          passwordHash: input.passwordHash,
          organizationMemberships: {
            create: { organizationId, roleId: input.roleId },
          },
        },
        ...userInclude(organizationId),
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
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.updateMany({
        where: { id, ...organizationWhere(organizationId) },
        data: { email: input.email, displayName: input.displayName },
      })
      if (user.count !== 1) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Usuario no encontrado',
          {
            code: 'P2025',
            clientVersion: '7.10.0',
          },
        )
      }
      const updated = await transaction.user.findFirstOrThrow({
        ...userInclude(organizationId),
        where: { id, ...organizationWhere(organizationId) },
      })
      await transaction.auditLog.create({
        data: auditData('USER_UPDATED', updated.id, context),
      })
      return updated
    })
  },

  updateRole(
    id: string,
    roleId: string,
    context: RequestContext,
    metadata: { fromRoleCode?: string; toRoleCode: string },
    organizationId: string,
  ) {
    return databaseService.transaction(async (transaction) => {
      const updated = await transaction.organizationMembership.updateMany({
        where: { userId: id, organizationId, active: true },
        data: { roleId },
      })
      if (updated.count !== 1) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Usuario no encontrado',
          {
            code: 'P2025',
            clientVersion: '7.10.0',
          },
        )
      }
      const user = await transaction.user.findFirstOrThrow({
        ...userInclude(organizationId),
        where: { id, ...organizationWhere(organizationId) },
      })
      await transaction.auditLog.create({
        data: auditData('USER_ROLE_CHANGED', user.id, context, metadata),
      })
      return user
    })
  },

  updateStatus(
    id: string,
    active: boolean,
    context: RequestContext,
    organizationId: string,
  ) {
    const now = new Date()
    return databaseService.transaction(async (transaction) => {
      const updated = await transaction.user.updateMany({
        where: { id, ...organizationWhere(organizationId) },
        data: { active },
      })
      if (updated.count !== 1) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Usuario no encontrado',
          {
            code: 'P2025',
            clientVersion: '7.10.0',
          },
        )
      }
      const user = await transaction.user.findFirstOrThrow({
        ...userInclude(organizationId),
        where: { id, ...organizationWhere(organizationId) },
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

  resetPassword(
    id: string,
    passwordHash: string,
    context: RequestContext,
    organizationId: string,
  ) {
    const now = new Date()
    return databaseService.transaction(async (transaction) => {
      const updated = await transaction.user.updateMany({
        where: { id, ...organizationWhere(organizationId) },
        data: {
          passwordHash,
          mustChangePassword: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
      if (updated.count !== 1) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Usuario no encontrado',
          {
            code: 'P2025',
            clientVersion: '7.10.0',
          },
        )
      }
      const user = await transaction.user.findFirstOrThrow({
        ...userInclude(organizationId),
        where: { id, ...organizationWhere(organizationId) },
      })
      await transaction.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      })
      await transaction.auditLog.create({
        data: auditData('PASSWORD_RESET_COMPLETED', user.id, context),
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

export type UserRecord =
  Awaited<ReturnType<typeof usersRepository.findById>> extends infer T
    ? NonNullable<T>
    : never
