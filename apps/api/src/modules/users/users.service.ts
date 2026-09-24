import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import { hashPassword } from '../auth/password.js'
import type { RequestContext } from '../auth/auth.types.js'
import { usersRepository, type UserRecord } from './users.repository.js'
import type {
  CreateUserInput,
  UpdateUserInput,
  UserListFilters,
  UserResponse,
} from './users.types.js'

function toResponse(user: UserRecord): UserResponse {
  const roles = user.roles.map(({ role }) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    permissions: role.permissions.map(({ permission }) => permission.code),
  }))

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    active: user.active,
    roleIds: roles.map((role) => role.id),
    permissions: [...new Set(roles.flatMap((role) => role.permissions))].sort(),
    roles,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'USER_DUPLICATE',
        'Ya existe un usuario con el mismo nombre de usuario o correo electrónico.',
      )
    }

    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'USER_ROLE_INVALID',
        'El rol seleccionado no está disponible.',
      )
    }

    if (error.code === 'P2025') {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
    }
  }

  throw error
}

async function assertRoleAvailable(roleId: string) {
  const role = await usersRepository.findActiveRoleById(roleId)
  if (!role) {
    throw new AppError(
      400,
      'USER_ROLE_INVALID',
      'El rol seleccionado no está disponible.',
    )
  }
  return role
}

async function assertUserExists(id: string) {
  const user = await usersRepository.findById(id)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
  return user
}

export const usersService = {
  async list(filters: UserListFilters) {
    const result = await usersRepository.list(filters)
    return {
      data: result.items.map(toResponse),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },

  async getById(id: string) {
    return { data: toResponse(await assertUserExists(id)) }
  },

  async create(input: CreateUserInput, context: RequestContext) {
    await assertRoleAvailable(input.roleId)
    const passwordHash = await hashPassword(input.password)

    try {
      return {
        data: toResponse(
          await usersRepository.create(
            {
              username: input.username,
              email: input.email,
              displayName: input.displayName,
              passwordHash,
              roleId: input.roleId,
            },
            context,
          ),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async update(id: string, input: UpdateUserInput, context: RequestContext) {
    await assertUserExists(id)

    try {
      return {
        data: toResponse(await usersRepository.update(id, input, context)),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateRole(
    id: string,
    roleId: string,
    actorId: string,
    context: RequestContext,
  ) {
    if (actorId === id) {
      throw new AppError(
        409,
        'USER_SELF_OPERATION',
        'No puedes modificar tu propio rol.',
      )
    }

    const current = await assertUserExists(id)
    const target = await assertRoleAvailable(roleId)
    const fromRoleCode = current.roles[0]?.role.code
    const toRoleCode = target.code

    try {
      return {
        data: toResponse(
          await usersRepository.updateRole(id, roleId, context, {
            fromRoleCode,
            toRoleCode,
          }),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    context: RequestContext,
  ) {
    if (!active && actorId === id) {
      throw new AppError(
        409,
        'USER_SELF_OPERATION',
        'No puedes desactivar tu propia cuenta.',
      )
    }

    await assertUserExists(id)

    try {
      return {
        data: toResponse(
          await usersRepository.updateStatus(id, active, context),
        ),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async listRoles() {
    return { data: await usersRepository.listRoles() }
  },
}
