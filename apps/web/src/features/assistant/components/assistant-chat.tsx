import { useState, type FormEvent } from 'react'
import { Bot, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { hasPermission } from '@/lib/permissions'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { useAssistant } from '../hooks/use-assistant'
import type { AssistantMessage } from '../types/assistant.types'

export function AssistantChat({
  period,
}: {
  period: { from: string | null; to: string | null }
}) {
  const { user } = useAuth()
  const assistant = useAssistant()
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  if (!hasPermission(user?.permissions ?? [], 'assistant:read')) return null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = question.trim()
    if (!message || assistant.isPending) return
    try {
      const answer = await assistant.mutateAsync({
        message,
        conversationId,
        ...period,
      })
      setConversationId(answer.conversationId)
      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: 'USER',
          content: message,
          createdAt: new Date().toISOString(),
        },
        {
          id: `assistant-${Date.now()}`,
          role: 'ASSISTANT',
          content: answer.message,
          createdAt: answer.generatedAt,
        },
      ])
      setQuestion('')
    } catch {
      // El estado de la mutación muestra el error dentro del chat.
      return
    }
  }

  return (
    <div className="fixed right-5 bottom-5 z-40 sm:right-7 sm:bottom-7">
      {isOpen && (
        <section
          id="assistant-chat"
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          className="absolute right-0 bottom-16 w-[calc(100vw-2.5rem)] max-w-md overflow-hidden rounded-2xl border bg-card shadow-xl sm:bottom-[4.5rem]"
        >
          <header className="flex items-start justify-between gap-3 border-b p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <Bot aria-hidden size={18} />
              </span>
              <div>
                <h2 id="assistant-title" className="text-sm font-semibold">
                  Asistente operativo
                </h2>
                <p className="text-xs text-muted-foreground">
                  Consultas de solo lectura
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="size-8 p-0"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X aria-hidden size={17} />
            </Button>
          </header>

          <div className="max-h-[min(55vh,34rem)] space-y-3 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {assistant.isPending && (
              <p
                role="status"
                aria-live="polite"
                className="rounded-xl bg-muted p-3 text-sm text-muted-foreground"
              >
                Analizando datos autorizados…
              </p>
            )}
            {assistant.isError && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
              >
                El asistente no está disponible. Verifica su configuración o
                inténtalo más tarde.
              </p>
            )}
            {!assistant.isPending &&
              !assistant.isError &&
              messages.length === 0 && (
                <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  Pregunta por ventas, caja, stock, citas, taller o
                  reabastecimiento.
                </p>
              )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    message.role === 'USER'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground'
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          <form className="flex gap-2 border-t p-3" onSubmit={submit}>
            <label className="sr-only" htmlFor="assistant-question">
              Consulta para el asistente
            </label>
            <Input
              id="assistant-question"
              className="h-10 min-w-0 flex-1 text-sm"
              value={question}
              maxLength={800}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="¿Qué requiere atención hoy?"
            />
            <Button
              type="submit"
              className="h-10 px-3"
              disabled={!question.trim() || assistant.isPending}
              aria-label="Enviar consulta"
            >
              <Send aria-hidden size={16} />
              <span className="sr-only">Consultar</span>
            </Button>
          </form>
        </section>
      )}

      <Button
        type="button"
        className="size-14 rounded-full p-0 shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="assistant-chat"
        aria-label={
          isOpen ? 'Cerrar asistente operativo' : 'Abrir asistente operativo'
        }
      >
        {isOpen ? <X aria-hidden size={22} /> : <Bot aria-hidden size={22} />}
      </Button>
    </div>
  )
}
