import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  AssistantAnswer,
  AssistantRequest,
} from '../types/assistant.types'

export const assistantService = {
  ask(input: AssistantRequest) {
    return api.post<AssistantAnswer>(endpoints.assistant.chat, input)
  },
}
