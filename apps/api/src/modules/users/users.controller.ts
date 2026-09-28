import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userQuerySchema,
  userRoleSchema,
  userStatusSchema,
} from './users.schemas.js'
import { usersService } from './users.service.js'

export const listUsers: RequestHandler = async (request, response) => {
  response.json(await usersService.list(userQuerySchema.parse(request.query)))
}

export const getUser: RequestHandler = async (request, response) => {
  const { id } = userIdSchema.parse(request.params)
  response.json(await usersService.getById(id))
}

export const createUser: RequestHandler = async (request, response) => {
  const result = await usersService.create(
    createUserSchema.parse(request.body),
    getRequestContext(request, response),
  )
  response.status(201).json(result)
}

export const updateUser: RequestHandler = async (request, response) => {
  const { id } = userIdSchema.parse(request.params)
  response.json(
    await usersService.update(
      id,
      updateUserSchema.parse(request.body),
      getRequestContext(request, response),
    ),
  )
}

export const updateUserRole: RequestHandler = async (request, response) => {
  const { id } = userIdSchema.parse(request.params)
  const { roleId } = userRoleSchema.parse(request.body)
  response.json(
    await usersService.updateRole(
      id,
      roleId,
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}

export const updateUserStatus: RequestHandler = async (request, response) => {
  const { id } = userIdSchema.parse(request.params)
  const { active } = userStatusSchema.parse(request.body)
  response.json(
    await usersService.updateStatus(
      id,
      active,
      request.auth!.id,
      getRequestContext(request, response),
    ),
  )
}

export const listRoles: RequestHandler = async (_request, response) => {
  response.json(await usersService.listRoles())
}
