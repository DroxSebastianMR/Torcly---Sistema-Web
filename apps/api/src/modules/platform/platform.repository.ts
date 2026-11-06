import { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { PlatformOrganizationFilters } from './platform.types.js'

const organizationInclude = {
  memberships: {
    where: { active: true },
    orderBy: { joinedAt: 'asc' },
    select: {
      user: { select: { id: true, displayName: true, email: true } },
      role: { select: { id: true, code: true, name: true } },
    },
  },
  _count: { select: { memberships: true } },
} satisfies Prisma.OrganizationInclude

const organizationMemberSelect = {
  organizationId: true,
  userId: true,
  active: true,
  joinedAt: true,
  user: {
    select: { id: true, displayName: true, email: true, username: true },
  },
  role: { select: { id: true, code: true, name: true } },
} satisfies Prisma.OrganizationMembershipSelect

function where(
  filters: PlatformOrganizationFilters,
): Prisma.OrganizationWhereInput {
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

export const platformRepository = {
  async listOrganizations(filters: PlatformOrganizationFilters) {
    const criteria = where(filters)
    const [items, total] = await Promise.all([
      databaseService.client.organization.findMany({
        where: criteria,
        include: organizationInclude,
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.organization.count({ where: criteria }),
    ])
    return { items, total }
  },

  listActiveRoles() {
    return databaseService.client.role.findMany({
      // La consola de plataforma administra roles de taller ya publicados.
      // Evitamos exponer roles efímeros creados por pruebas de integración.
      where: { active: true, code: 'administrator' },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    })
  },

  findActiveRole(roleId: string) {
    return databaseService.client.role.findFirst({
      where: {
        id: roleId,
        active: true,
        code: 'administrator',
      },
      select: { id: true, code: true, name: true },
    })
  },

  findOrganization(organizationId: string) {
    return databaseService.client.organization.findUnique({
      where: { id: organizationId },
      include: organizationInclude,
    })
  },

  listOrganizationMembers(organizationId: string) {
    return databaseService.client.organizationMembership.findMany({
      where: { organizationId },
      select: organizationMemberSelect,
      orderBy: [{ active: 'desc' }, { joinedAt: 'asc' }],
    })
  },

  updateOrganizationStatus(organizationId: string, active: boolean) {
    return databaseService.transaction(async (transaction) => {
      const organization = await transaction.organization.update({
        where: { id: organizationId },
        data: { active },
        include: organizationInclude,
      })
      if (!active) {
        await transaction.authSession.updateMany({
          where: { activeOrganizationId: organizationId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      return organization
    })
  },

  updateOrganization(
    organizationId: string,
    data: {
      code: string
      name: string
      ownerRoleId: string
      ownerName?: string
      ownerEmail?: string
    },
  ) {
    return databaseService.transaction(async (transaction) => {
      const organization = await transaction.organization.update({
        where: { id: organizationId },
        data: { code: data.code, name: data.name },
        include: organizationInclude,
      })
      const owner = organization.memberships[0]
      if (!owner) return organization

      const userUpdate: { displayName?: string; email?: string } = {}
      if (data.ownerName && data.ownerName !== owner.user.displayName) {
        userUpdate.displayName = data.ownerName
      }
      if (data.ownerEmail && data.ownerEmail !== owner.user.email) {
        userUpdate.email = data.ownerEmail
      }

      if (Object.keys(userUpdate).length > 0) {
        await transaction.user.update({
          where: { id: owner.user.id },
          data: userUpdate,
        })
      }

      if (owner.role.id !== data.ownerRoleId) {
        await transaction.organizationMembership.update({
          where: {
            organizationId_userId: {
              organizationId,
              userId: owner.user.id,
            },
          },
          data: { roleId: data.ownerRoleId },
        })
        await transaction.authSession.updateMany({
          where: {
            userId: owner.user.id,
            activeOrganizationId: organizationId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        })
      }

      return transaction.organization.findUniqueOrThrow({
        where: { id: organizationId },
        include: organizationInclude,
      })
    })
  },

  createOrganizationMember(input: {
    organizationId: string
    username: string
    email: string
    displayName: string
    passwordHash: string
    roleId: string
  }) {
    return databaseService.transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          username: input.username,
          email: input.email,
          displayName: input.displayName,
          passwordHash: input.passwordHash,
        },
        select: { id: true },
      })
      return transaction.organizationMembership.create({
        data: {
          organizationId: input.organizationId,
          userId: user.id,
          roleId: input.roleId,
        },
        select: organizationMemberSelect,
      })
    })
  },

  updateOrganizationMember(
    organizationId: string,
    userId: string,
    data: { active?: boolean; roleId?: string },
  ) {
    return databaseService.transaction(async (transaction) => {
      const membership = await transaction.organizationMembership.update({
        where: { organizationId_userId: { organizationId, userId } },
        data,
        select: organizationMemberSelect,
      })
      if (data.active === false || data.roleId !== undefined) {
        await transaction.authSession.updateMany({
          where: {
            userId,
            activeOrganizationId: organizationId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        })
      }
      return membership
    })
  },

  resetOrganizationMemberPassword(
    organizationId: string,
    userId: string,
    passwordHash: string,
    context?: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const membership = await transaction.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        select: organizationMemberSelect,
      })
      if (!membership) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Miembro no encontrado',
          {
            code: 'P2025',
            clientVersion: '7.10.0',
          },
        )
      }
      await transaction.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
      await transaction.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      await transaction.auditLog.create({
        data: {
          event: 'PASSWORD_RESET_COMPLETED',
          userId,
          organizationId,
          requestId: context?.requestId,
          ipAddress: context?.ipAddress,
        },
      })
      return membership
    })
  },

  createOrganization(input: {
    code: string
    name: string
    owner: {
      username: string
      email: string
      displayName: string
      passwordHash: string
      roleId: string
    }
  }) {
    return databaseService.transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: { code: input.code, name: input.name },
        select: { id: true },
      })
      const user = await transaction.user.create({
        data: {
          username: input.owner.username,
          email: input.owner.email,
          displayName: input.owner.displayName,
          passwordHash: input.owner.passwordHash,
        },
        select: { id: true },
      })
      await transaction.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          roleId: input.owner.roleId,
        },
      })
      return transaction.organization.findUniqueOrThrow({
        where: { id: organization.id },
        include: organizationInclude,
      })
    })
  },
}

export type PlatformOrganizationRecord = Prisma.OrganizationGetPayload<{
  include: typeof organizationInclude
}>
