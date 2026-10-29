export interface AssistantPeriod {
  from: string | null
  to: string | null
}

export interface AssistantSource {
  module: string
  label: string
  path: string
}

export interface AssistantContext {
  generatedAt: string
  period: AssistantPeriod
  sources: AssistantSource[]
  facts: Record<string, unknown>
}

export interface AssistantAnswer {
  conversationId: string
  message: string
  generatedAt: string
  period: AssistantPeriod
  sources: AssistantSource[]
  disclaimer: string
}

export interface AssistantConversationSummary {
  id: string
  title: string
  updatedAt: string
  preview: string | null
}

export interface AssistantConversationDetail {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Array<{
    id: string
    role: 'USER' | 'ASSISTANT'
    content: string
    createdAt: string
  }>
}

export interface AiCompletionInput {
  message: string
  context: AssistantContext
  history: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>
}

export interface AiProvider {
  complete(input: AiCompletionInput): Promise<string>
}
