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
  message: string
  generatedAt: string
  period: AssistantPeriod
  sources: AssistantSource[]
  disclaimer: string
}

export interface AiCompletionInput {
  message: string
  context: AssistantContext
}

export interface AiProvider {
  complete(input: AiCompletionInput): Promise<string>
}
