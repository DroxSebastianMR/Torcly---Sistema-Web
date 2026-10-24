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
  message: string
  generatedAt: string
  period: AssistantPeriod
  sources: AssistantSource[]
  disclaimer: string
}

export interface AssistantRequest extends AssistantPeriod {
  message: string
}
