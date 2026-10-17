import { useState } from 'react'
import { ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useRunDetail } from '../hooks/use-replenishment'
import {
  eligibilityOptions,
  priorityOptions,
} from '../services/replenishment.service'
import type { RunDetailFilters } from '../types/replenishment.types'
import {
  formatCount,
  formatDateTime,
  formatPeriodLabel,
  formatQuantity,
} from '../utils/replenishment-formatters'
import { RecommendationsTable } from './recommendations-table'

interface RunDetailModalProps {
  code: string | null
  onClose: () => void
}

const initialFilters: RunDetailFilters = {
  search: '',
  priority: '',
  eligible: '',
  page: 1,
  pageSize: 20,
}

export function RunDetailModal({ code, onClose }: RunDetailModalProps) {
  const [filters, setFilters] = useState<RunDetailFilters>(initialFilters)
  const detail = useRunDetail(code, filters)
  const open = Boolean(code)

  const suggestions: readonly SmartSelectOption[] = (
    detail.data?.items ?? []
  ).map((item) => ({
    value: item.code,
    label: `${item.name} · ${item.code}`,
    searchTerms: [item.code, item.name],
  }))

  const run = detail.data?.run

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={run ? `Corrida ${run.code}` : code ? `Corrida ${code}` : 'Corrida'}
      description="La corrida es una fotografía inmutable de la recomendación calculada en ese momento."
      className="max-w-5xl"
      visual={
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScanSearch aria-hidden size={18} />
        </span>
      }
      footer={
        detail.data ? (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Página {detail.data.pagination.page} de{' '}
              {detail.data.pagination.totalPages} ·{' '}
              {formatCount(detail.data.pagination.total)} resultados
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={filters.page >= detail.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {run && (
        <div className="mb-5 grid gap-3 rounded-xl bg-muted/70 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <DetailField
            label="Ejecutada el"
            value={formatDateTime(run.executedAt)}
          />
          <DetailField label="Ejecutado por" value={run.actorName} />
          <DetailField
            label="Período"
            value={formatPeriodLabel(run.period.from, run.period.to)}
          />
          <DetailField
            label="Cobertura objetivo"
            value={`${run.coverageTargetDays} días`}
          />
          <DetailField
            label="Elegibles"
            value={`${formatCount(run.eligibleCount)} de ${formatCount(run.recommendationCount)}`}
          />
          <DetailField
            label="Sugerido total"
            value={formatQuantity(run.suggestedTotal)}
          />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SmartSelect
            value={filters.search}
            aria-label="Buscar en el detalle de la corrida"
            placeholder="Buscar producto en la corrida"
            searchPlaceholder="Escribe un código o nombre…"
            emptyMessage="Sigue escribiendo para buscar."
            forceSearch
            allowCustomValue
            options={suggestions}
            onChange={(search) =>
              setFilters((current) => ({ ...current, search, page: 1 }))
            }
          />
        </div>
        <div className="w-full sm:w-52">
          <SmartSelect
            value={filters.priority}
            placeholder="Todas las prioridades"
            aria-label="Filtrar detalle por prioridad"
            options={priorityOptions()}
            onChange={(priority) =>
              setFilters((current) => ({
                ...current,
                priority: priority as RunDetailFilters['priority'],
                page: 1,
              }))
            }
          />
        </div>
        <div className="w-full sm:w-52">
          <SmartSelect
            value={filters.eligible}
            placeholder="Todos los productos"
            aria-label="Filtrar detalle por elegibilidad"
            options={eligibilityOptions()}
            onChange={(eligible) =>
              setFilters((current) => ({
                ...current,
                eligible: eligible as RunDetailFilters['eligible'],
                page: 1,
              }))
            }
          />
        </div>
      </div>

      {detail.isError ? (
        <ErrorState
          title="No se pudo cargar el detalle de la corrida"
          description="Verifica la conexión con la API e inténtalo nuevamente."
          busy={detail.isFetching}
          action={{
            label: 'Reintentar',
            onClick: () => void detail.refetch(),
          }}
        />
      ) : (
        <RecommendationsTable
          recommendations={detail.data?.items ?? []}
          loading={detail.isPending}
        />
      )}
    </Modal>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  )
}
