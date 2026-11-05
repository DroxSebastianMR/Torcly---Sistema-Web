import { Router } from 'express'
import { requireAuth, requirePlatformAdmin } from '../auth/auth.middleware.js'
import {
  createOrganizationMember,
  createOrganization,
  getPlatformAccess,
  listOrganizationMembers,
  listOrganizations,
  listPlatformRoles,
  updateOrganizationMember,
  updateOrganization,
  updateOrganizationStatus,
} from './platform.controller.js'

export const platformRouter = Router()

platformRouter.use(requireAuth, requirePlatformAdmin)
platformRouter.get('/access', getPlatformAccess)
platformRouter.get('/roles', listPlatformRoles)
platformRouter.get('/organizations', listOrganizations)
platformRouter.post('/organizations', createOrganization)
platformRouter.patch('/organizations/:organizationId', updateOrganization)
platformRouter.patch(
  '/organizations/:organizationId/status',
  updateOrganizationStatus,
)
platformRouter.get(
  '/organizations/:organizationId/members',
  listOrganizationMembers,
)
platformRouter.post(
  '/organizations/:organizationId/members',
  createOrganizationMember,
)
platformRouter.patch(
  '/organizations/:organizationId/members/:userId',
  updateOrganizationMember,
)
