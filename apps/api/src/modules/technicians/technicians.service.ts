import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  techniciansRepository,
  type TechnicianRecord,
} from './technicians.repository.js'
import type {
  TechnicianFilters,
  TechnicianInput,
  TechnicianResponse,
} from './technicians.types.js'

const toResponse = (item: TechnicianRecord): TechnicianResponse => ({
  id: item.id,
  code: item.code,
  fullName: item.fullName,
  document: item.document,
  phone: item.phone,
  email: item.email,
  specialties: item.specialties,
  notes: item.notes,
  active: item.active,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
})
function persistence(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002')
      throw new AppError(
        409,
        'TECHNICIAN_DUPLICATE',
        'El documento o correo ya corresponde a otro técnico.',
      )
    if (error.code === 'P2025')
      throw new AppError(404, 'TECHNICIAN_NOT_FOUND', 'Técnico no encontrado.')
  }
  throw error
}
export const techniciansService = {
  async list(filters: TechnicianFilters) {
    const result = await techniciansRepository.list(filters)
    return {
      data: result.items.map(toResponse),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },
  async getById(id: string) {
    const item = await techniciansRepository.findById(id)
    if (!item)
      throw new AppError(404, 'TECHNICIAN_NOT_FOUND', 'Técnico no encontrado.')
    return { data: toResponse(item) }
  },
  async getOptions() {
    return { data: await techniciansRepository.listActive() }
  },
  async create(
    input: TechnicianInput,
    actorId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await techniciansRepository.create(input, actorId, context),
        ),
      }
    } catch (error) {
      return persistence(error)
    }
  },
  async update(
    id: string,
    input: TechnicianInput,
    actorId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await techniciansRepository.update(id, input, actorId, context),
        ),
      }
    } catch (error) {
      return persistence(error)
    }
  },
  async updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    context: RequestContext,
  ) {
    try {
      return {
        data: toResponse(
          await techniciansRepository.updateStatus(
            id,
            active,
            actorId,
            context,
          ),
        ),
      }
    } catch (error) {
      return persistence(error)
    }
  },
}
