import { Router } from 'express'
import {
  login,
  logout,
  me,
  requestPasswordRecovery,
  resetPassword,
} from './auth.controller.js'
import { requireAuth } from './auth.middleware.js'

export const authRouter = Router()

authRouter.post('/login', login)
authRouter.get('/me', requireAuth, me)
authRouter.post('/logout', requireAuth, logout)
authRouter.post('/forgot-password', requestPasswordRecovery)
authRouter.post('/reset-password', resetPassword)
