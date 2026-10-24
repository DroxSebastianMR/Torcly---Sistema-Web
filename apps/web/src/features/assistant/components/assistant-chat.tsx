import { useState, type FormEvent } from 'react'
import { Bot, Send, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/permissions'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { useAssistant } from '../hooks/use-assistant'
import type { AssistantAnswer } from '../types/assistant.types'

export function AssistantChat({
  period,
}: {
  period: { from: string | null; to: string | null }
}) {
  const { user } = useAuth()
  const assistant = useAssistant()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null)
  if (!hasPermission(user?.permissions ?? [], 'assistant:read')) {
    return (
      <section
        className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground"
        aria-label="Asistente operativo restringido"
      >
        El asistente operativo no está disponible para tu rol.
      </section>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = question.trim()
    if (!message || assistant.isPending) return
    try {
      setAnswer(await assistant.mutateAsync({ message, ...period }))
      setQuestion('')
    } catch {
      setAnswer(null)
    }
  }

  return (
    <section
      className="rounded-2xl border bg-card p-5"
      aria-labelledby="assistant-title"
    >
      <div className="flex gap-3">
        <span className="rounded-xl bg-primary/10 p-3 text-primary">
          <Bot aria-hidden size={20} />
        </span>
        <div>
          <h2 id="assistant-title" className="font-semibold">
            Asistente operativo
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta datos autorizados; no crea, edita, cancela ni ejecuta
            operaciones.
          </p>
        </div>
      </div>
      <form className="mt-4 flex gap-2" onSubmit={submit}>
        <label className="sr-only" htmlFor="assistant-question">
          Consulta para el asistente
        </label>
        <input
          id="assistant-question"
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
          value={question}
          maxLength={800}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ej.: ¿Qué requiere atención hoy?"
        />
        <Button
          type="submit"
          disabled={!question.trim() || assistant.isPending}
        >
          <Send aria-hidden size={16} /> Consultar
        </Button>
      </form>
      {assistant.isPending && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 text-sm text-muted-foreground"
        >
          Analizando datos autorizados…
        </p>
      )}
      {assistant.isError && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          El asistente no está disponible. Verifica su configuración o inténtalo
          más tarde.
        </p>
      )}
      {!assistant.isPending && !assistant.isError && !answer && (
        <p className="mt-4 text-sm text-muted-foreground">
          Haz una consulta sobre ventas, caja, stock, citas, taller o
          reabastecimiento.
        </p>
      )}
      {answer && (
        <div className="mt-4 space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
          <p className="whitespace-pre-wrap">{answer.message}</p>
          <p className="text-xs text-muted-foreground">
            Datos generados:{' '}
            {new Date(answer.generatedAt).toLocaleString('es-PE')}. Período:{' '}
            {answer.period.from ?? 'sin inicio'} a{' '}
            {answer.period.to ?? 'sin fin'}.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span className="font-medium">Fuentes:</span>
            {answer.sources.map((source) => (
              <Link
                key={source.module}
                className="text-primary underline"
                to={source.path}
              >
                {source.label}
              </Link>
            ))}
          </div>
          <p className="flex gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden size={14} className="shrink-0" />
            {answer.disclaimer}
          </p>
        </div>
      )}
    </section>
  )
}
