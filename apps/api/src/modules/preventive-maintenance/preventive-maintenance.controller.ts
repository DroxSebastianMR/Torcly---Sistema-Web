import type { RequestHandler } from 'express'
import { requireOrganizationContext } from '../auth/organization-context.js'
import { preventiveMaintenanceService } from './preventive-maintenance.service.js'
import type { PreventiveMaintenanceQuery } from './preventive-maintenance.types.js'

export const getPreventiveMaintenanceReminders: RequestHandler = async (
  request,
  response,
) => {
  const organization = requireOrganizationContext(request.auth)
  const query: PreventiveMaintenanceQuery = {
    priority: request.query.priority as PreventiveMaintenanceQuery['priority'],
    search: typeof request.query.search === 'string' ? request.query.search : undefined,
  }

  const result = await preventiveMaintenanceService.getReminders(
    organization.id,
    organization.name,
    query,
  )

  response.status(200).json(result)
}
