import { useState } from 'react'
import { Bot, MessageSquareText, UserRound } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import {
  useAssistantConversation,
  useAssistantConversations,
} from '../hooks/use-assistant'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AssistantHistoryPage() {
  const conversations = useAssistantConversations()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useAssistantConversation(selectedId)

  if (conversations.isError) {
    return (
      <ErrorState
        title="No se pudo cargar el historial IA"
        action={{
          label: 'Reintentar',
          onClick: () => void conversations.refetch(),
        }}
      />
    )
  }

  const items = conversations.data ?? []
  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Asistente operativo
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Historial IA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revisa tus conversaciones anteriores con el asistente. Solo tú puedes
          ver este historial.
        </p>
      </header>

      {conversations.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="Aún no hay conversaciones"
          description="Las consultas que hagas desde la burbuja del Dashboard aparecerán aquí."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <aside className="max-h-[65vh] space-y-1 overflow-y-auto rounded-2xl border bg-card p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                  selectedId === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.preview ?? 'Sin mensajes'}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {formatDate(item.updatedAt)}
                </p>
              </button>
            ))}
          </aside>

          <section className="min-h-80 rounded-2xl border bg-card p-4">
            {!selectedId ? (
              <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
                Selecciona una conversación para leerla.
              </div>
            ) : selected.isError ? (
              <ErrorState
                title="No se pudo cargar la conversación"
                action={{
                  label: 'Reintentar',
                  onClick: () => void selected.refetch(),
                }}
              />
            ) : selected.isLoading || !selected.data ? (
              <div className="h-72 animate-pulse rounded-xl bg-muted" />
            ) : (
              <div className="space-y-3">
                <h2 className="border-b pb-3 font-semibold">
                  {selected.data.title}
                </h2>
                {selected.data.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'ASSISTANT' && (
                      <Bot aria-hidden className="mt-1 size-4 text-primary" />
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    {message.role === 'USER' && (
                      <UserRound
                        aria-hidden
                        className="mt-1 size-4 text-primary"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
