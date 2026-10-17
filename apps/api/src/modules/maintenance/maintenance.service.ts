import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import { maintenanceRepository } from './maintenance.repository.js'
import type {
  MaintenanceScheduleInput,
  MaintenanceStatus,
  MaintenanceWindowAdmin,
  MaintenanceWindowStatus,
  MaintenanceWindowView,
} from './maintenance.types.js'

interface MaintenanceWindowRecord {
  id: string
  startsAt: Date
  endsAt: Date
  message: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceActor {
  id: string
  name: string
}

function statusOf(
  window: { startsAt: Date; endsAt: Date },
  now: Date,
): MaintenanceWindowStatus {
  if (window.startsAt <= now && window.endsAt > now) return 'active'
  if (window.startsAt > now) return 'scheduled'
  return 'past'
}

function toView(
  window: MaintenanceWindowRecord,
  now: Date,
): MaintenanceWindowView {
  return {
    id: window.id,
    startsAt: window.startsAt.toISOString(),
    endsAt: window.endsAt.toISOString(),
    message: window.message,
    status: statusOf(window, now),
  }
}

function toAdmin(window: MaintenanceWindowRecord): MaintenanceWindowAdmin {
  return {
    id: window.id,
    startsAt: window.startsAt.toISOString(),
    endsAt: window.endsAt.toISOString(),
    message: window.message,
    createdBy: window.createdBy,
    createdAt: window.createdAt.toISOString(),
  }
}

export const maintenanceService = {
  async getStatus(now = new Date()): Promise<MaintenanceStatus> {
    const window = await maintenanceRepository.findActiveOrNext(now)
    return {
      generatedAt: now.toISOString(),
      window: window ? toView(window, now) : null,
    }
  },

  async list(): Promise<MaintenanceWindowAdmin[]> {
    const windows = await maintenanceRepository.list()
    return windows.map(toAdmin)
  },

  async schedule(
    input: MaintenanceScheduleInput,
    actor: MaintenanceActor,
    context: RequestContext,
  ): Promise<MaintenanceWindowAdmin> {
    const created = await maintenanceRepository.create(
      {
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        message: input.message,
        createdBy: actor.name,
        actorId: actor.id,
        requestId: context.requestId,
      },
      context,
    )
    return toAdmin(created)
  },

  async cancel(
    id: string,
    actor: MaintenanceActor,
    context: RequestContext,
  ): Promise<void> {
    const result = await maintenanceRepository.cancel(id, actor.id, context)
    if (!result.cancelled) {
      throw new AppError(
        404,
        'MAINTENANCE_NOT_FOUND',
        'La ventana de mantenimiento no existe.',
      )
    }
  },
}
