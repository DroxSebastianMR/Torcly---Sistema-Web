import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import { listAuditLogs } from './audit.controller.js'

export const auditRouter = Router()

auditRouter.use(requireAuth)
auditRouter.get('/', requirePermission('audit:read'), listAuditLogs)
