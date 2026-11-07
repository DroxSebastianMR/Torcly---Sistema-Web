import type { RequestHandler } from 'express'
import {
  clearImpersonatorCookie,
  readImpersonatorCookie,
  readSessionCookie,
  setImpersonatorCookie,
  setSessionCookie,
} from '../auth/auth.cookies.js'
import { getRequestContext } from '../auth/auth.middleware.js'
import { AppError } from '../../shared/errors/app-error.js'
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

export const resetOrganizationMemberPassword: RequestHandler = async (
  request,
  response,
) => {
  const { organizationId, userId } =
    platformOrganizationMemberParamsSchema.parse(request.params)
  response.json(
    await platformService.resetOrganizationMemberPassword(
      organizationId,
      userId,
      getRequestContext(request, response),
    ),
  )
}

export const impersonateOrganization: RequestHandler = async (
  request,
  response,
) => {
  const { organizationId } = platformOrganizationParamsSchema.parse(
    request.params,
  )
  const currentToken = readSessionCookie(request)
  if (!currentToken || !request.auth) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
  }

  const result = await platformService.impersonateOrganization(
    organizationId,
    request.auth,
    getRequestContext(request, response),
  )

  // Guardar token original de super admin en cookie de impersonador
  setImpersonatorCookie(response, currentToken)
  // Establecer sesión del usuario impersonado
  setSessionCookie(response, result.token)

  response.status(200).json({ data: result.user })
}

export const exitImpersonation: RequestHandler = async (request, response) => {
  const impersonatorToken = readImpersonatorCookie(request)
  if (!impersonatorToken) {
    throw new AppError(
      400,
      'IMPERSONATION_NOT_ACTIVE',
      'No hay una sesión de soporte activa para finalizar.',
    )
  }

  const adminUser = await platformService.exitImpersonation(
    request.sessionTokenHash,
    impersonatorToken,
    getRequestContext(request, response),
  )

  clearImpersonatorCookie(response)
  setSessionCookie(response, impersonatorToken)

  response.status(200).json({ data: adminUser })
}
