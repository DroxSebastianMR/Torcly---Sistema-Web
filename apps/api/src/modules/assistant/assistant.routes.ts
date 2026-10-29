import { Router } from 'express'
import { requireAuth, requirePermission } from '../auth/auth.middleware.js'
import {
  askAssistant,
  getAssistantConversation,
  listAssistantConversations,
} from './assistant.controller.js'

export const assistantRouter = Router()
assistantRouter.use(requireAuth, requirePermission('assistant:read'))
assistantRouter.get('/conversations', listAssistantConversations)
assistantRouter.get('/conversations/:id', getAssistantConversation)
assistantRouter.post('/chat', askAssistant)
