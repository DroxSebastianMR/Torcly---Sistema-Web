import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
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
          Seguridad y trazabilidad
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Auditoría
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registro de accesos y acciones administrativas. Los campos muestran el
          contexto mínimo permitido, sin secretos ni datos sensibles.
        </p>
      </header>

      <ModuleMetrics
        items={[{ label: 'Registros encontrados', value: total }]}
      />

      <section
        aria-label="Filtros de auditoría"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
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
      </section>

      <section
        aria-label="Resultados de auditoría"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
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
            <DataTable
              wrapperClassName="hidden md:block"
              className="min-w-[820px]"
            >
              <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
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
            </DataTable>

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

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
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
