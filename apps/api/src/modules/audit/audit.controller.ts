import type { RequestHandler } from 'express'
import { auditQuerySchema } from './audit.schemas.js'
import { auditService } from './audit.service.js'

export const listAuditLogs: RequestHandler = async (request, response) => {
  const query = auditQuerySchema.parse(request.query)
  response.json(await auditService.search(query))
}
