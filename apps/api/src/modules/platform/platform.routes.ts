import { Router } from 'express'
import { requireAuth, requirePlatformAdmin } from '../auth/auth.middleware.js'
import {
  createOrganizationMember,
  createOrganization,
  getPlatformAccess,
  listOrganizationMembers,
  listOrganizations,
  listPlatformRoles,
  resetOrganizationMemberPassword,
  updateOrganizationMember,
  updateOrganization,
  updateOrganizationStatus,
} from './platform.controller.js'
import {
  getPlatformSubscriptionMetrics,
  listPlatformPlans,
  listPlatformSubscriptions,
  updatePlatformSubscription,
} from '../subscriptions/subscriptions.controller.js'

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
platformRouter.post(
  '/organizations/:organizationId/members/:userId/reset-password',
  resetOrganizationMemberPassword,
)

// Suscripciones y planes comerciales (Sprint 28)
platformRouter.get('/plans', listPlatformPlans)
platformRouter.get('/subscriptions', listPlatformSubscriptions)
platformRouter.get('/subscriptions/metrics', getPlatformSubscriptionMetrics)
platformRouter.patch(
  '/subscriptions/:organizationId',
  updatePlatformSubscription,
)
