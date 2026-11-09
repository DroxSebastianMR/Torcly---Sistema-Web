import { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import { generateTemporaryPassword, hashPassword } from '../auth/password.js'
import { authService } from '../auth/auth.service.js'
import { createSessionToken, hashSessionToken } from '../auth/session-token.js'
import { subscriptionsService } from '../subscriptions/subscriptions.service.js'
import type { AuthUser, RequestContext } from '../auth/auth.types.js'
import {
  platformRepository,
  type PlatformOrganizationRecord,
} from './platform.repository.js'
import type {
  CreatePlatformOrganizationDto,
  CreatePlatformOrganizationMemberDto,
  UpdatePlatformOrganizationDto,
} from './platform.schemas.js'
import type { PlatformOrganizationFilters } from './platform.types.js'

function toOrganization(record: PlatformOrganizationRecord) {
  const owner = record.memberships[0]
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    active: record.active,
    owner: owner
      ? {
          id: owner.user.id,
          displayName: owner.user.displayName,
          email: owner.user.email,
          role: owner.role,
        }
      : null,
    memberCount: record._count.memberships,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toMember(
  record: Awaited<
    ReturnType<typeof platformRepository.updateOrganizationMember>
  >,
) {
  return {
    id: record.user.id,
    username: record.user.username,
    displayName: record.user.displayName,
    email: record.user.email,
    active: record.active,
    joinedAt: record.joinedAt.toISOString(),
    role: record.role,
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'PLATFORM_ORGANIZATION_DUPLICATE',
        'El código del taller, el correo o el usuario ya está en uso.',
      )
    }
    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'PLATFORM_ROLE_INVALID',
        'El rol seleccionado ya no está disponible.',
      )
    }
  }
  throw error
}

export const platformService = {
  async listOrganizations(filters: PlatformOrganizationFilters) {
    const result = await platformRepository.listOrganizations(filters)
    return {
      data: result.items.map(toOrganization),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },

  async listRoles() {
    return { data: await platformRepository.listActiveRoles() }
  },

  async createOrganization(input: CreatePlatformOrganizationDto) {
    const role = await platformRepository.findActiveRole(input.owner.roleId)
    if (!role) {
      throw new AppError(
        400,
        'PLATFORM_ROLE_INVALID',
        'Selecciona un rol activo para el responsable del taller.',
      )
    }

    try {
      const record = await platformRepository.createOrganization({
        ...input,
        owner: {
          ...input.owner,
          passwordHash: await hashPassword(input.owner.password),
        },
      })
      return { data: toOrganization(record) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateOrganizationStatus(organizationId: string, active: boolean) {
    try {
      const organization = await platformRepository.updateOrganizationStatus(
        organizationId,
        active,
      )
      if (!active) authService.invalidateOrganizationSessions(organizationId)
      return { data: toOrganization(organization) }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError(
          404,
          'PLATFORM_ORGANIZATION_NOT_FOUND',
          'No se encontró el taller.',
        )
      }
      throw error
    }
  },

  async updateOrganization(
    organizationId: string,
    input: UpdatePlatformOrganizationDto,
  ) {
    const role = await platformRepository.findActiveRole(input.ownerRoleId)
    if (!role) {
      throw new AppError(
        400,
        'PLATFORM_ROLE_INVALID',
        'Selecciona un rol disponible para el responsable del taller.',
      )
    }
    try {
      const updated = await platformRepository.updateOrganization(
        organizationId,
        input,
      )
      if (input.ownerEmail && updated.memberships[0]) {
        authService.invalidateUserSessions(updated.memberships[0].user.id)
      }
      return {
        data: toOrganization(updated),
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError(
          404,
          'PLATFORM_ORGANIZATION_NOT_FOUND',
          'No se encontró el taller.',
        )
      }
      return mapPersistenceError(error)
    }
  },

  async listOrganizationMembers(organizationId: string) {
    const organization =
      await platformRepository.findOrganization(organizationId)
    if (!organization) {
      throw new AppError(
        404,
        'PLATFORM_ORGANIZATION_NOT_FOUND',
        'No se encontró el taller.',
      )
    }
    const members =
      await platformRepository.listOrganizationMembers(organizationId)
    return { data: members.map(toMember) }
  },

  async createOrganizationMember(
    organizationId: string,
    input: CreatePlatformOrganizationMemberDto,
  ) {
    const organization =
      await platformRepository.findOrganization(organizationId)
    if (!organization) {
      throw new AppError(
        404,
        'PLATFORM_ORGANIZATION_NOT_FOUND',
        'No se encontró el taller.',
      )
    }
    if (!organization.active) {
      throw new AppError(
        409,
        'PLATFORM_ORGANIZATION_INACTIVE',
        'Activa el taller antes de añadir miembros.',
      )
    }
    const role = await platformRepository.findActiveRole(input.roleId)
    if (!role) {
      throw new AppError(
        400,
        'PLATFORM_ROLE_INVALID',
        'Selecciona un rol activo para el miembro.',
      )
    }
    await subscriptionsService.checkMemberQuota(organizationId)
    try {
      const member = await platformRepository.createOrganizationMember({
        organizationId,
        ...input,
        passwordHash: await hashPassword(input.password),
      })
      return { data: toMember(member) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateOrganizationMember(
    organizationId: string,
    userId: string,
    input: { active?: boolean; roleId?: string },
  ) {
    if (input.roleId) {
      const role = await platformRepository.findActiveRole(input.roleId)
      if (!role) {
        throw new AppError(
          400,
          'PLATFORM_ROLE_INVALID',
          'Selecciona un rol activo para el miembro.',
        )
      }
    }
    if (input.active === true) {
      await subscriptionsService.checkMemberQuota(organizationId)
    }
    try {
      const member = await platformRepository.updateOrganizationMember(
        organizationId,
        userId,
        input,
      )
      if (input.active === false || input.roleId !== undefined) {
        authService.invalidateUserSessions(userId)
      }
      return { data: toMember(member) }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError(
          404,
          'PLATFORM_MEMBER_NOT_FOUND',
          'No se encontró el miembro del taller.',
        )
      }
      throw error
    }
  },

  async resetOrganizationMemberPassword(
    organizationId: string,
    userId: string,
    context?: RequestContext,
  ) {
    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(temporaryPassword)
    try {
      const member = await platformRepository.resetOrganizationMemberPassword(
        organizationId,
        userId,
        passwordHash,
        context,
      )
      authService.invalidateUserSessions(userId)
      return {
        data: {
          temporaryPassword,
          member: toMember(member),
        },
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new AppError(
          404,
          'PLATFORM_MEMBER_NOT_FOUND',
          'No se encontró el miembro del taller.',
        )
      }
      throw error
    }
  },

  async impersonateOrganization(
    organizationId: string,
    adminUser: AuthUser,
    context?: RequestContext,
  ) {
    if (!adminUser.isPlatformAdmin) {
      throw new AppError(
        403,
        'PLATFORM_ACCESS_FORBIDDEN',
        'Solo administradores de plataforma pueden usar el modo soporte.',
      )
    }

    const organization = await databaseService.client.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          where: { active: true },
          include: {
            user: true,
            role: {
              include: {
                permissions: {
                  include: { permission: { select: { code: true } } },
                },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    if (!organization) {
      throw new AppError(
        404,
        'PLATFORM_ORGANIZATION_NOT_FOUND',
        'No se encontró la organización.',
      )
    }

    if (!organization.active) {
      throw new AppError(
        400,
        'ORGANIZATION_INACTIVE',
        'La organización se encuentra desactivada.',
      )
    }

    const targetMembership =
      organization.memberships.find((m) =>
        ['owner', 'admin', 'workshop_manager'].includes(m.role.code),
      ) ?? organization.memberships[0]

    if (!targetMembership) {
      throw new AppError(
        400,
        'ORGANIZATION_HAS_NO_MEMBERS',
        'La organización no cuenta con miembros activos para impersonar.',
      )
    }

    const impersonationToken = createSessionToken()
    const tokenHash = hashSessionToken(impersonationToken)
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000)

    await databaseService.client.authSession.create({
      data: {
        tokenHash,
        userId: targetMembership.userId,
        activeOrganizationId: organization.id,
        expiresAt,
        ipAddress: context?.ipAddress,
        userAgent: `Impersonated by ${adminUser.email} | ${context?.userAgent ?? ''}`.slice(0, 300),
      },
    })

    await databaseService.client.auditLog.create({
      data: {
        event: 'LOGIN_SUCCESS',
        userId: targetMembership.userId,
        identifier: targetMembership.user.email,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        organizationId: organization.id,
        metadata: {
          type: 'IMPERSONATION_STARTED',
          impersonatorId: adminUser.id,
          impersonatorEmail: adminUser.email,
          targetOrganizationId: organization.id,
          targetOrganizationName: organization.name,
        },
      },
    })

    const permissions = new Set(
      targetMembership.role.permissions.map((p) => p.permission.code),
    )

    return {
      token: impersonationToken,
      user: {
        id: targetMembership.user.id,
        name: targetMembership.user.displayName,
        email: targetMembership.user.email,
        username: targetMembership.user.username,
        permissions: [...permissions].sort(),
        isPlatformAdmin: targetMembership.user.isPlatformAdmin,
        mustChangePassword: false,
        role: {
          code: targetMembership.role.code,
          name: targetMembership.role.name,
        },
        organization: {
          id: organization.id,
          code: organization.code,
          name: organization.name,
        },
        impersonatedBy: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
        },
      },
    }
  },

  async exitImpersonation(
    currentSessionTokenHash: string | undefined,
    impersonatorToken: string,
    context?: RequestContext,
  ) {
    if (currentSessionTokenHash) {
      await databaseService.client.authSession.deleteMany({
        where: { tokenHash: currentSessionTokenHash },
      })
    }

    const impersonatorAuth = await authService.authenticate(
      impersonatorToken,
      context ?? {},
    )

    if (!impersonatorAuth.user.isPlatformAdmin) {
      throw new AppError(
        403,
        'PLATFORM_ACCESS_FORBIDDEN',
        'Sesión de administrador de plataforma no válida.',
      )
    }

    return impersonatorAuth.user
  },
}
