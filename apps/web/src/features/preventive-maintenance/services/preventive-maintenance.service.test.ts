import { describe, expect, it, vi } from 'vitest'
import { api } from '@/infrastructure/api/client'
import { preventiveMaintenanceService } from './preventive-maintenance.service'

describe('Preventive Maintenance Web Service', () => {
  it('calls endpoint with priority filter when provided', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: [],
      metrics: {
        totalVehiclesAnalyzed: 0,
        criticalCount: 0,
        warningCount: 0,
        upToDateCount: 0,
      },
    })

    await preventiveMaintenanceService.getReminders({
      priority: 'CRITICAL',
      search: 'ABC-123',
    })

    expect(spy).toHaveBeenCalledWith(
      '/preventive-maintenance?priority=CRITICAL&search=ABC-123',
      undefined,
    )
  })

  it('omits priority query when priority is all', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: [],
      metrics: {
        totalVehiclesAnalyzed: 0,
        criticalCount: 0,
        warningCount: 0,
        upToDateCount: 0,
      },
    })

    await preventiveMaintenanceService.getReminders({
      priority: 'all',
      search: '',
    })

    expect(spy).toHaveBeenCalledWith('/preventive-maintenance', undefined)
  })
})
