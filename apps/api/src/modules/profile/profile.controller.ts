import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  changePasswordSchema,
  profileIdParamSchema,
  updateProfileSchema,
} from './profile.schemas.js'
import { profileService } from './profile.service.js'

export const getProfile: RequestHandler = async (request, response) => {
  const params = profileIdParamSchema.parse(request.params)
  const result = await profileService.getProfile(params.id, request.auth!)
  response.json(result)
}

export const updateProfile: RequestHandler = async (request, response) => {
  const params = profileIdParamSchema.parse(request.params)
  const input = updateProfileSchema.parse(request.body)
  const result = await profileService.updateProfile(
    params.id,
    request.auth!,
    input,
    getRequestContext(request, response),
  )
  response.json(result)
}

export const changePassword: RequestHandler = async (request, response) => {
  const input = changePasswordSchema.parse(request.body)
  const result = await profileService.changePassword(
    request.auth!,
    input,
    getRequestContext(request, response),
  )
  response.json(result)
}
