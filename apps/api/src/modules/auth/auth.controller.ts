import type { RequestHandler } from 'express'
import { clearSessionCookie, setSessionCookie } from './auth.cookies.js'
import { getRequestContext } from './auth.middleware.js'
import { loginSchema } from './auth.schemas.js'
import { authService } from './auth.service.js'

export const login: RequestHandler = async (request, response) => {
  const result = await authService.login(
    loginSchema.parse(request.body),
    getRequestContext(request, response),
  )
  setSessionCookie(response, result.token)
  response.json(result.user)
}

export const me: RequestHandler = (request, response) => {
  response.json(request.auth)
}

export const logout: RequestHandler = async (request, response) => {
  await authService.logout(
    request.sessionTokenHash!,
    request.auth!.id,
    getRequestContext(request, response),
  )
  clearSessionCookie(response)
  response.status(204).send()
}
