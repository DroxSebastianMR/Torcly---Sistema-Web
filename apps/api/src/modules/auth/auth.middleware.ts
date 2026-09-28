import type { Request, RequestHandler, Response } from 'express'
import { AppError } from '../../shared/errors/app-error.js'
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from './auth.cookies.js'
import { authService } from './auth.service.js'
import type { RequestContext } from './auth.types.js'

export function getRequestContext(
  request: Request,
  response: Response,
): RequestContext {
  return {
    requestId: response.locals.requestId,
    ipAddress: request.ip,
    userAgent: request.get('user-agent')?.slice(0, 300),
  }
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = readSessionCookie(request)
  try {
    if (!token)
      throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')

    const authenticated = await authService.authenticate(
      token,
      getRequestContext(request, response),
    )
    request.auth = authenticated.user
    request.sessionTokenHash = authenticated.tokenHash
    setSessionCookie(response, token)
    next()
  } catch (error) {
    if (token) clearSessionCookie(response)
    next(error)
  }
}

export function requirePermission(permission: string): RequestHandler {
  return async (request, response, next) => {
    try {
      if (!request.auth)
        throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión.')
      await authService.assertPermission(
        request.auth,
        permission,
        getRequestContext(request, response),
      )
      next()
    } catch (error) {
      next(error)
    }
  }
}
