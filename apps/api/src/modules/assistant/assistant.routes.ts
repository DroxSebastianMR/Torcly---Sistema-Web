import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import { askAssistant } from './assistant.controller.js'

export const assistantRouter = Router()
assistantRouter.use(requireAuth, requirePermission('assistant:read'))
assistantRouter.post('/chat', askAssistant)
