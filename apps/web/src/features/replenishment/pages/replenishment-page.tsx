import { useDeferredValue, useState } from 'react'
import { History, ListChecks, PackagePlus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { RecommendationsTable } from '../components/recommendations-table'
import { ReplenishmentToolbar } from '../components/replenishment-toolbar'
import { RunDetailModal } from '../components/run-detail-modal'
import { RunModal } from '../components/run-modal'
import { RunTable } from '../components/run-table'
import {
  useEligibility,
  useReplenishmentRuns,
} from '../hooks/use-replenishment'
import type {
  EligibilityFilters,
  RunHistoryFilters,
} from '../types/replenishment.types'
import {
  defaultPeriod,
  formatCount,
  formatPeriodLabel,
} from '../utils/replenishment-formatters'

type ReplenishmentView = 'recommendations' | 'history'

const initialEligibilityFilters: EligibilityFilters = {
  ...defaultPeriod(),
  coverageDays: 30,
  search: '',
  priority: '',
  eligible: '',
  page: 1,
  pageSize: 20,
}

const initialHistoryFilters: RunHistoryFilters = {
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'inventory:write',
  )
  const [view, setView] = useState<ReplenishmentView>('recommendations')
  const [eligibilityFilters, setEligibilityFilters] =
    useState<EligibilityFilters>(initialEligibilityFilters)
  const [historyFilters, setHistoryFilters] = useState<RunHistoryFilters>(
    initialHistoryFilters,
  )
  const [runOpen, setRunOpen] = useState(false)
  const [detailCode, setDetailCode] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(eligibilityFilters.search)
  const eligibility = useEligibility({
    ...eligibilityFilters,
    search: deferredSearch,
  })
  const runs = useReplenishmentRuns(historyFilters)

  const appliedPeriod = eligibility.data?.period ?? {
    from: eligibilityFilters.from,
    to: eligibilityFilters.to,
  }
  const appliedPeriodLabel = formatPeriodLabel(
    appliedPeriod.from,
    appliedPeriod.to,
  )
  const counts = eligibility.data?.counts
  const runTotal = runs.data?.pagination.total ?? 0

  const recommendations = eligibility.data?.items ?? []
  const suggestions = recommendations.map((item) => ({
    value: item.code,
    label: `${item.name} · ${item.code}`,
    searchTerms: [item.code, item.name],
  }))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={15} /> Reabastecimiento asistido
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Reabastecimiento
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Recomendaciones de compra explicables calculadas con la demanda
            confirmada del período. Ejecutar una corrida solo registra el
            cálculo; nunca modifica el inventario.
          </p>
        </div>
        {canWrite && (
          <Button type="button" onClick={() => setRunOpen(true)}>
            <PackagePlus size={16} /> Ejecutar corrida
          </Button>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          {view === 'recommendations' && counts ? (
            <>
              <CountItem
                label="Productos analizados"
                value={formatCount(counts.total)}
              />
              <div className="h-8 w-px bg-border" />
              <CountItem
                label="Elegibles"
                value={formatCount(counts.eligible)}
                tone="text-emerald-700"
              />
              <div className="h-8 w-px bg-border" />
              <CountItem
                label="Críticas"
                value={formatCount(counts.critical)}
                tone="text-rose-700"
              />
              <div className="h-8 w-px bg-border" />
              <CountItem
                label="Aconsejables"
                value={formatCount(counts.advisable)}
                tone="text-amber-700"
              />
              <p className="w-full text-xs text-muted-foreground">
                Productos por prioridad de todo el período; los filtros solo
                acotan la tabla.
              </p>
            </>
          ) : (
            <CountItem
              label="Corridas encontradas"
              value={formatCount(runTotal)}
            />
          )}
          <div
            role="tablist"
            aria-label="Secciones de reabastecimiento"
            className="ml-auto flex rounded-xl bg-muted p-1"
          >
            {(
              [
                ['recommendations', 'Recomendaciones'],
                ['history', 'Historial'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {value === 'history' ? (
                  <History size={15} />
                ) : (
                  <ListChecks size={15} />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        <ReplenishmentToolbar
          view={view}
          eligibilityFilters={eligibilityFilters}
          historyFilters={historyFilters}
          suggestions={suggestions}
          onEligibilityChange={(filters) => {
            setEligibilityFilters(filters)
            setView('recommendations')
          }}
          onHistoryChange={(filters) => {
            setHistoryFilters(filters)
            setView('history')
          }}
        />

        {view === 'recommendations' ? (
          <>
            <div className="border-b px-4 py-3 text-sm sm:px-5">
              <span className="text-muted-foreground">Período aplicado: </span>
              <span className="font-medium">{appliedPeriodLabel}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                · demanda confirmada (ventas y consumos de taller)
              </span>
            </div>
            {eligibility.isError ? (
              <ErrorState
                title="No se pudieron cargar las recomendaciones"
                description="Verifica la conexión con la API e inténtalo nuevamente."
                busy={eligibility.isFetching}
                action={{
                  label: 'Reintentar',
                  onClick: () => void eligibility.refetch(),
                }}
              />
            ) : (
              <RecommendationsTable
                recommendations={recommendations}
                loading={eligibility.isPending}
              />
            )}
            {eligibility.data && eligibility.data.pagination.totalPages > 1 && (
              <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
                <span className="text-muted-foreground">
                  Página {eligibilityFilters.page} de{' '}
                  {eligibility.data.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={eligibilityFilters.page === 1}
                    onClick={() =>
                      setEligibilityFilters((current) => ({
                        ...current,
                        page: current.page - 1,
                      }))
                    }
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      eligibilityFilters.page >=
                      eligibility.data.pagination.totalPages
                    }
                    onClick={() =>
                      setEligibilityFilters((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </footer>
            )}
          </>
        ) : runs.isError ? (
          <ErrorState
            title="No se pudo cargar el historial"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={runs.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void runs.refetch(),
            }}
          />
        ) : (
          <>
            <RunTable
              runs={runs.data?.items ?? []}
              loading={runs.isPending}
              onOpenDetail={setDetailCode}
            />
            {runs.data && runs.data.pagination.totalPages > 1 && (
              <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
                <span className="text-muted-foreground">
                  Página {historyFilters.page} de{' '}
                  {runs.data.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={historyFilters.page === 1}
                    onClick={() =>
                      setHistoryFilters((current) => ({
                        ...current,
                        page: current.page - 1,
                      }))
                    }
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      historyFilters.page >= runs.data.pagination.totalPages
                    }
                    onClick={() =>
                      setHistoryFilters((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>

      <RunModal
        open={runOpen}
        period={appliedPeriod}
        coverageDays={eligibilityFilters.coverageDays}
        onClose={() => setRunOpen(false)}
      />
      <RunDetailModal
        key={detailCode ?? 'closed'}
        code={detailCode}
        onClose={() => setDetailCode(null)}
      />
    </div>
  )
}

function CountItem({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div>
      <p className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
