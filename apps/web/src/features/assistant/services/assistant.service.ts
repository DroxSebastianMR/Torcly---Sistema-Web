import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  AssistantAnswer,
  AssistantConversation,
  AssistantConversationSummary,
  AssistantRequest,
} from '../types/assistant.types'

export const assistantService = {
  ask(input: AssistantRequest) {
    return api.post<AssistantAnswer>(endpoints.assistant.chat, input)
  },
  listConversations() {
    return api.get<AssistantConversationSummary[]>(
      endpoints.assistant.conversations,
    )
  },
  getConversation(id: string) {
    return api.get<AssistantConversation>(
      `${endpoints.assistant.conversations}/${id}`,
    )
  },
}
