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

// La sesión nunca puede reutilizarse desde la caché del navegador o de un
// intermediario. Un 304 en /me no contiene el usuario y Axios lo interpreta
// como fallo, dejando al cliente esperando una sesión que ya no puede leer.
authRouter.use((_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store, private, max-age=0')
  response.setHeader('Pragma', 'no-cache')
  next()
})

authRouter.post('/login', login)
authRouter.get('/me', requireAuth, me)
authRouter.post('/logout', requireAuth, logout)
authRouter.post('/forgot-password', requestPasswordRecovery)
authRouter.post('/reset-password', resetPassword)
