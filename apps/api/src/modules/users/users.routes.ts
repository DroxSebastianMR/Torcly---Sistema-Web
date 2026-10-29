import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  createUser,
  getUser,
  listRoles,
  listUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from './users.controller.js'

export const usersRouter = Router()

usersRouter.use(requireAuth)
usersRouter.get('/', requirePermission('users:read'), listUsers)
usersRouter.get('/roles', requirePermission('users:read'), listRoles)
usersRouter.get('/:id', requirePermission('users:read'), getUser)
usersRouter.post('/', requirePermission('users:write'), createUser)
usersRouter.put('/:id', requirePermission('users:write'), updateUser)
usersRouter.patch('/:id/role', requirePermission('users:write'), updateUserRole)
usersRouter.patch(
  '/:id/status',
  requirePermission('users:write'),
  updateUserStatus,
)
