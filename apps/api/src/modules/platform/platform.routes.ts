import { Router } from 'express'
import { requireAuth, requirePlatformAdmin } from '../auth/auth.middleware.js'
import {
  createOrganizationMember,
  createOrganization,
  exitImpersonation,
  getPlatformAccess,
  impersonateOrganization,
  listOrganizationMembers,
  listOrganizations,
  listPlatformRoles,
  resetOrganizationMemberPassword,
  updateOrganizationMember,
  updateOrganization,
  updateOrganizationStatus,
} from './platform.controller.js'
import {
  assignOrganizationSubscription,
  createPlatformPlan,
  getPlatformSubscriptionMetrics,
  listPlatformPlans,
  listPlatformSubscriptions,
  updatePlatformPlan,
  updatePlatformSubscription,
} from '../subscriptions/subscriptions.controller.js'

export const platformRouter = Router()

// Salir de modo soporte solo requiere estar autenticado y portar la cookie de impersonador
platformRouter.post('/exit-impersonation', requireAuth, exitImpersonation)

platformRouter.use(requireAuth, requirePlatformAdmin)
platformRouter.get('/access', getPlatformAccess)
platformRouter.get('/roles', listPlatformRoles)
platformRouter.get('/organizations', listOrganizations)
platformRouter.post('/organizations', createOrganization)
platformRouter.post(
  '/organizations/:organizationId/impersonate',
  impersonateOrganization,
)
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
platformRouter.post('/plans', createPlatformPlan)
platformRouter.patch('/plans/:planId', updatePlatformPlan)
platformRouter.get('/subscriptions', listPlatformSubscriptions)
platformRouter.post('/subscriptions', assignOrganizationSubscription)
platformRouter.get('/subscriptions/metrics', getPlatformSubscriptionMetrics)
platformRouter.patch(
  '/subscriptions/:organizationId',
  updatePlatformSubscription,
)
