import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware.js'
import {
  changePassword,
  getProfile,
  updateProfile,
} from './profile.controller.js'

export const profileRouter = Router()

profileRouter.use(requireAuth)

profileRouter.get('/', getProfile)
profileRouter.get('/:id', getProfile)
profileRouter.put('/', updateProfile)
profileRouter.put('/:id', updateProfile)
profileRouter.post('/change-password', changePassword)
