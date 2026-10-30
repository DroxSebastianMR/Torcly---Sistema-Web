import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  exportReports,
  getReportBlock,
  getReportsSummary,
} from './reports.controller.js'

export const reportsRouter = Router()

reportsRouter.use(requireAuth)
reportsRouter.get(
  '/summary',
  requirePermission('reports:read'),
  getReportsSummary,
)
reportsRouter.get('/export', requirePermission('reports:read'), exportReports)
reportsRouter.get(
  '/blocks/:block',
  requirePermission('reports:read'),
  getReportBlock,
)
