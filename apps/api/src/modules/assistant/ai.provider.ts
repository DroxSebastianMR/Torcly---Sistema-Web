import { AppError } from '../../shared/errors/app-error.js'
import type { AiCompletionInput, AiProvider } from './assistant.types.js'

export class FakeProvider implements AiProvider {
  async complete(input: AiCompletionInput): Promise<string> {
    const sections = Object.keys(input.context.facts)
    if (sections.length === 0) {
      return 'No hay evidencia suficiente en los módulos autorizados para responder esa consulta.'
    }
    return `Consulta recibida. La evidencia disponible proviene de: ${input.context.sources.map((source) => source.label).join(', ')}. Revisa las fuentes enlazadas para el detalle operativo.`
  }
}

export class GroqProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {}

  async complete(input: AiCompletionInput): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            max_tokens: 350,
            messages: [
              {
                role: 'system',
                content:
                  'Eres el asistente de Torcly. Solo respondes con la evidencia agregada proporcionada. No inventes datos. No propones ni ejecutas acciones de creación, edición, cancelación, pagos o inventario. Si falta evidencia, dilo claramente. Responde breve, en español.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  question: input.message,
                  context: input.context,
                }),
              },
            ],
          }),
        },
      )
      if (response.status === 429) {
        throw new AppError(
          429,
          'ASSISTANT_RATE_LIMITED',
          'El asistente está temporalmente saturado. Inténtalo en un momento.',
        )
      }
      if (!response.ok) {
        throw new AppError(
          503,
          'ASSISTANT_UNAVAILABLE',
          'El asistente no está disponible por el momento.',
        )
      }
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = payload.choices?.[0]?.message?.content?.trim()
      if (!content) {
        throw new AppError(
          503,
          'ASSISTANT_UNAVAILABLE',
          'El asistente no pudo generar una respuesta.',
        )
      }
      return content.slice(0, 2500)
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(
          504,
          'ASSISTANT_TIMEOUT',
          'El asistente tardó demasiado. Inténtalo nuevamente.',
        )
      }
      throw new AppError(
        503,
        'ASSISTANT_UNAVAILABLE',
        'El asistente no está disponible por el momento.',
      )
    } finally {
      clearTimeout(timeout)
    }
  }
}
