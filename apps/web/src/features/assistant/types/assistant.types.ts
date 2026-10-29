export interface AssistantPeriod {
  from: string | null
  to: string | null
}

export interface AssistantSource {
  module: string
  label: string
  path: string
}

export interface AssistantAnswer {
  conversationId: string
  message: string
  generatedAt: string
  period: AssistantPeriod
  sources: AssistantSource[]
  disclaimer: string
}

export interface AssistantRequest extends AssistantPeriod {
  message: string
  conversationId?: string
}

export interface AssistantConversationSummary {
  id: string
  title: string
  updatedAt: string
  preview: string | null
}

export interface AssistantMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export interface AssistantConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AssistantMessage[]
}
