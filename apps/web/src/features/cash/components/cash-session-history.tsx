import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { TableActionButton } from '@/components/ui/table-action-button'
import { Eye, Landmark } from 'lucide-react'
import type {
  CashSession,
  CashSessionsResponse,
} from '../types/cash-session.types'
import {
  currencyFormatter,
  dateTimeFormatter,
} from '../utils/payment-formatters'

interface CashSessionHistoryProps {
  response: CashSessionsResponse | undefined
  loading: boolean
  page: number
  onPageChange: (page: number) => void
  onOpen: (session: CashSession) => void
}

export function CashSessionHistory({
  response,
  loading,
  page,
  onPageChange,
  onOpen,
}: CashSessionHistoryProps) {
  if (loading)
    return (
      <div
        aria-label="Cargando cierres"
        className="h-40 animate-pulse rounded-2xl border bg-muted/50"
      />
    )
  if (!response?.data.length) {
    return (
      <section className="overflow-hidden rounded-2xl border bg-card">
        <EmptyState
          icon={Landmark}
          title="Aún no hay cierres de caja"
          description="Los períodos cerrados aparecerán aquí para su consulta."
        />
      </section>
    )
  }
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
            <tr>
              <th className="px-5 py-3">Caja</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3 text-right">Esperado</th>
              <th className="px-4 py-3 text-right">Contado</th>
              <th className="px-4 py-3 text-right">Diferencia</th>
              <th className="px-4 py-3">Cerrada por</th>
              <th className="px-4 py-3 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {response.data.map((session) => (
              <tr
                key={session.id}
                className="cursor-pointer hover:bg-[#f9fbfa]"
                onClick={() => onOpen(session)}
              >
                <td className="px-5 py-4 font-semibold">{session.code}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  {dateTimeFormatter.format(new Date(session.openedAt))} —{' '}
                  {session.closedAt
                    ? dateTimeFormatter.format(new Date(session.closedAt))
                    : '—'}
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  {currencyFormatter.format(session.expectedCashAmount ?? 0)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  {currencyFormatter.format(session.countedCashAmount ?? 0)}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">
                  {currencyFormatter.format(session.differenceAmount ?? 0)}
                </td>
                <td className="px-4 py-4">{session.closedBy ?? '—'}</td>
                <td
                  className="px-4 py-4 text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  <TableActionButton
                    onClick={() => onOpen(session)}
                    label={`Ver ${session.code}`}
                    title="Ver detalle"
                  >
                    <Eye aria-hidden size={17} />
                  </TableActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y md:hidden">
        {response.data.map((session) => (
          <article
            key={session.id}
            className="cursor-pointer px-4 py-4"
            onClick={() => onOpen(session)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{session.code}</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold tabular-nums">
                  {currencyFormatter.format(session.differenceAmount ?? 0)}
                </p>
                <TableActionButton
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpen(session)
                  }}
                  label={`Ver ${session.code}`}
                  title="Ver detalle"
                >
                  <Eye aria-hidden size={17} />
                </TableActionButton>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cerrada por {session.closedBy ?? '—'}
            </p>
          </article>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={response.pagination.totalPages}
        onPageChange={onPageChange}
      />
    </section>
  )
}
