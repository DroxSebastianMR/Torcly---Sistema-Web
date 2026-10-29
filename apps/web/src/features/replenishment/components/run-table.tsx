import { History, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { ReplenishmentRunSummary } from '../types/replenishment.types'
import {
  formatCount,
  formatDateTime,
  formatPeriodLabel,
  formatQuantity,
} from '../utils/replenishment-formatters'

interface RunTableProps {
  runs: readonly ReplenishmentRunSummary[]
  loading: boolean
  onOpenDetail: (code: string) => void
}

export function RunTable({ runs, loading, onOpenDetail }: RunTableProps) {
  if (loading) return <RunsSkeleton />

  if (!runs.length) {
    return (
      <EmptyState
        icon={History}
        title="Sin corridas registradas"
        description="Las corridas de reabastecimiento aparecerán aquí cuando se ejecuten en la pestaña de recomendaciones."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
            <tr>
              <th className="px-5 py-3">Corrida</th>
              <th className="px-4 py-3">Fecha y hora</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3 text-right">Cobertura</th>
              <th className="px-4 py-3 text-right">Elegibles</th>
              <th className="px-4 py-3 text-right">Sugerido total</th>
              <th className="px-4 py-3">Ejecutado por</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {runs.map((run) => (
              <tr key={run.code} className="hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <p className="font-mono text-sm font-semibold text-brand-forest">
                    {run.code}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {run.strategyVersion}
                  </p>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDateTime(run.executedAt)}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatPeriodLabel(run.period.from, run.period.to)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  {run.coverageTargetDays} d
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  {formatCount(run.eligibleCount)}
                  <span className="text-xs text-muted-foreground">
                    {' '}
                    / {run.recommendationCount}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums text-emerald-700">
                  {formatQuantity(run.suggestedTotal)}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {run.actorName}
                </td>
                <td className="px-4 py-4 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3"
                    aria-label={`Ver detalle de corrida ${run.code}`}
                    onClick={() => onOpenDetail(run.code)}
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {runs.map((run) => (
          <article key={run.code} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-brand-forest">
                  {run.code}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {run.strategyVersion}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(run.executedAt)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <RunInfo
                label="Período"
                value={formatPeriodLabel(run.period.from, run.period.to)}
              />
              <RunInfo
                label="Cobertura"
                value={`${run.coverageTargetDays} d`}
              />
              <RunInfo
                label="Elegibles"
                value={`${formatCount(run.eligibleCount)} / ${run.recommendationCount}`}
              />
              <RunInfo
                label="Sugerido total"
                value={formatQuantity(run.suggestedTotal)}
              />
              <RunInfo label="Ejecutado por" value={run.actorName} />
            </div>
            <div className="mt-4 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full"
                aria-label={`Ver detalle de corrida ${run.code}`}
                onClick={() => onOpenDetail(run.code)}
              >
                Ver detalle
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function RunInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  )
}

function RunsSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando corridas">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="ml-auto h-3 w-20 rounded bg-muted" />
          <X className="text-muted" />
        </div>
      ))}
    </div>
  )
}
