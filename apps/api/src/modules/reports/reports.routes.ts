import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import { getReportBlock, getReportsSummary } from './reports.controller.js'

export const reportsRouter = Router()

reportsRouter.use(requireAuth)
reportsRouter.get(
  '/summary',
  requirePermission('reports:read'),
  getReportsSummary,
)
reportsRouter.get(
  '/blocks/:block',
  requirePermission('reports:read'),
  getReportBlock,
)
