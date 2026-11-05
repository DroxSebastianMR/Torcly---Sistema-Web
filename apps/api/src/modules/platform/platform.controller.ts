import type { RequestHandler } from 'express'
import {
  createPlatformOrganizationMemberSchema,
  createPlatformOrganizationSchema,
  platformOrganizationMemberParamsSchema,
  platformOrganizationParamsSchema,
  platformOrganizationQuerySchema,
  updatePlatformOrganizationMemberSchema,
  updatePlatformOrganizationSchema,
  updatePlatformOrganizationStatusSchema,
} from './platform.schemas.js'
import { platformService } from './platform.service.js'

/**
 * Punto de entrada mínimo para la consola interna. No entrega datos de
 * talleres; permite que el frontend compruebe el acceso de plataforma.
 */
export const getPlatformAccess: RequestHandler = (_request, response) => {
  response.status(200).json({ access: 'platform' })
}

export const listOrganizations: RequestHandler = async (request, response) => {
  response.json(
    await platformService.listOrganizations(
      platformOrganizationQuerySchema.parse(request.query),
    ),
  )
}

export const listPlatformRoles: RequestHandler = async (_request, response) => {
  response.json(await platformService.listRoles())
}

export const createOrganization: RequestHandler = async (request, response) => {
  response
    .status(201)
    .json(
      await platformService.createOrganization(
        createPlatformOrganizationSchema.parse(request.body),
      ),
    )
}

export const updateOrganizationStatus: RequestHandler = async (
  request,
  response,
) => {
  const { organizationId } = platformOrganizationParamsSchema.parse(
    request.params,
  )
  response.json(
    await platformService.updateOrganizationStatus(
      organizationId,
      updatePlatformOrganizationStatusSchema.parse(request.body).active,
    ),
  )
}

export const updateOrganization: RequestHandler = async (request, response) => {
  const { organizationId } = platformOrganizationParamsSchema.parse(
    request.params,
  )
  response.json(
    await platformService.updateOrganization(
      organizationId,
      updatePlatformOrganizationSchema.parse(request.body),
    ),
  )
}

export const listOrganizationMembers: RequestHandler = async (
  request,
  response,
) => {
  const { organizationId } = platformOrganizationParamsSchema.parse(
    request.params,
  )
  response.json(await platformService.listOrganizationMembers(organizationId))
}

export const createOrganizationMember: RequestHandler = async (
  request,
  response,
) => {
  const { organizationId } = platformOrganizationParamsSchema.parse(
    request.params,
  )
  response
    .status(201)
    .json(
      await platformService.createOrganizationMember(
        organizationId,
        createPlatformOrganizationMemberSchema.parse(request.body),
      ),
    )
}

export const updateOrganizationMember: RequestHandler = async (
  request,
  response,
) => {
  const { organizationId, userId } =
    platformOrganizationMemberParamsSchema.parse(request.params)
  response.json(
    await platformService.updateOrganizationMember(
      organizationId,
      userId,
      updatePlatformOrganizationMemberSchema.parse(request.body),
    ),
  )
}
