import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { SmartSelect } from '@/components/ui/smart-select'
import { useAuditLogs } from '../hooks/use-audit'
import type { AuditFilters } from '../types/audit.types'
import {
  auditEventOptions,
  formatAuditDate,
  formatAuditEvent,
} from '../utils/audit-formatters'

const PAGE_SIZE = 25

const eventFilterOptions = [
  { value: '', label: 'Todos los eventos' },
  ...auditEventOptions,
]

export default function Page() {
  const [event, setEvent] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [page, setPage] = useState(1)

  const filters: AuditFilters = {
    page,
    pageSize: PAGE_SIZE,
    event: event || undefined,
    identifier: identifier.trim() || undefined,
  }
  const logs = useAuditLogs(filters)
  const items = logs.data?.items ?? []
  const totalPages = logs.data?.totalPages ?? 1
  const total = logs.data?.total ?? 0

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <ScrollText size={15} /> Seguridad y trazabilidad
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Auditoría
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registro de accesos y acciones administrativas. Los campos muestran el
          contexto mínimo permitido, sin secretos ni datos sensibles.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:max-w-3xl">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Evento</span>
          <SmartSelect
            aria-label="Filtrar por evento"
            options={eventFilterOptions}
            value={event}
            onChange={(value) => {
              setEvent(value)
              setPage(1)
            }}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Identificador</span>
          <Input
            type="search"
            value={identifier}
            placeholder="Correo, usuario o RUC"
            onChange={(event) => {
              setIdentifier(event.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>

      {logs.isError ? (
        <EmptyState
          title="No se pudo cargar la auditoría"
          description="Revisa tu conexión y vuelve a intentarlo."
          action={{ label: 'Reintentar', onClick: () => void logs.refetch() }}
        />
      ) : logs.isLoading ? (
        <AuditSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin registros para mostrar"
          description="No encontramos eventos con los filtros seleccionados."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-sm md:block">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Fecha y hora</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Identificador</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Solicitud</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f9fbfa]">
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatAuditDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      {formatAuditEvent(item.event)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.actorName ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.identifier ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.requestId ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y rounded-2xl border border-border bg-card shadow-sm md:hidden">
            {items.map((item) => (
              <article key={item.id} className="space-y-2 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">
                    {formatAuditEvent(item.event)}
                  </p>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatAuditDate(item.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.actorName ?? '—'} · {item.identifier ?? '—'}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {item.requestId ?? '—'}
                </p>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total} registro{total === 1 ? '' : 's'} · página {page} de{' '}
              {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || logs.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || logs.isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AuditSkeleton() {
  return (
    <div
      aria-label="Cargando auditoría"
      className="divide-y rounded-2xl border border-border bg-card shadow-sm"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
          <div className="ml-auto h-3 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
