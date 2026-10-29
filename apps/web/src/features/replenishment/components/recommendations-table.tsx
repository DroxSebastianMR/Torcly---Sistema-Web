import { useState } from 'react'
import { BadgeHelp, ChevronDown, ListTree, X } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { ReplenishmentRecommendation } from '../types/replenishment.types'
import { formatQuantity } from '../utils/replenishment-formatters'
import { PriorityBadge } from './priority-badge'

interface RecommendationsTableProps {
  recommendations: readonly ReplenishmentRecommendation[]
  loading: boolean
  minDemandPoints?: number
}

export function RecommendationsTable({
  recommendations,
  loading,
  minDemandPoints = 3,
}: RecommendationsTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())

  if (loading) return <RecommendationsSkeleton />

  if (!recommendations.length) {
    return (
      <EmptyState
        icon={ListTree}
        title="Sin resultados por los filtros"
        description="Ningún producto coincide con la búsqueda o prioridad seleccionada. Amplía el período o ajusta la cobertura."
      />
    )
  }

  const toggle = (code: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Stock actual</th>
              <th className="px-4 py-3 text-right">Demanda</th>
              <th className="px-4 py-3 text-right">Cobertura objetivo</th>
              <th className="px-4 py-3 text-right">Stock objetivo</th>
              <th className="px-4 py-3 text-right">Sugerido</th>
              <th className="px-4 py-3 text-right">Cobertura actual</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3 text-right">Por qué</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recommendations.map((recommendation) => {
              const isExpanded = expanded.has(recommendation.code)
              return (
                <RecommendationRow
                  key={recommendation.code}
                  recommendation={recommendation}
                  minDemandPoints={minDemandPoints}
                  isExpanded={isExpanded}
                  onToggle={() => toggle(recommendation.code)}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {recommendations.map((recommendation) => {
          const isExpanded = expanded.has(recommendation.code)
          return (
            <RecommendationCard
              key={recommendation.code}
              recommendation={recommendation}
              minDemandPoints={minDemandPoints}
              isExpanded={isExpanded}
              onToggle={() => toggle(recommendation.code)}
            />
          )
        })}
      </div>
    </>
  )
}

function RecommendationCard({
  recommendation,
  minDemandPoints,
  isExpanded,
  onToggle,
}: {
  recommendation: ReplenishmentRecommendation
  minDemandPoints: number
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <article className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{recommendation.name}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {recommendation.code}
          </p>
        </div>
        <PriorityBadge priority={recommendation.priority} />
      </div>
      <div className="mt-3">
        <EligibilityBadge
          recommendation={recommendation}
          minDemandPoints={minDemandPoints}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Info
          label="Stock actual"
          value={
            recommendation.stockCurrent === null
              ? '—'
              : formatQuantity(recommendation.stockCurrent)
          }
        />
        <Info
          label="Demanda"
          value={`${formatQuantity(recommendation.demandQuantity)} / ${recommendation.periodDays} d`}
        />
        <Info
          label="Sugerido"
          value={
            recommendation.suggestedQuantity === null
              ? '—'
              : formatQuantity(recommendation.suggestedQuantity)
          }
        />
        <Info
          label="Cobertura objetivo"
          value={`${recommendation.coverageTargetDays} d`}
        />
        <Info
          label="Cobertura actual"
          value={
            recommendation.currentCoverageDays === null
              ? '—'
              : formatQuantity(recommendation.currentCoverageDays)
          }
        />
        <Info
          label="Stock objetivo"
          value={
            recommendation.targetStock === null
              ? '—'
              : formatQuantity(recommendation.targetStock)
          }
        />
      </div>
      <div className="mt-4 border-t pt-3">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={`Ver explicación de ${recommendation.name}`}
          onClick={onToggle}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {isExpanded ? (
            <ChevronDown aria-hidden className="size-4" />
          ) : (
            <BadgeHelp aria-hidden className="size-4" />
          )}
          {isExpanded ? 'Ocultar explicación' : 'Por qué'}
        </button>
        {isExpanded && (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {recommendation.explanation}
          </p>
        )}
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  )
}

function RecommendationRow({
  recommendation,
  minDemandPoints,
  isExpanded,
  onToggle,
}: {
  recommendation: ReplenishmentRecommendation
  minDemandPoints: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const suggested = recommendation.suggestedQuantity
  return (
    <>
      <tr className="hover:bg-[#f9fbfa]">
        <td className="px-5 py-4">
          <p className="max-w-56 truncate font-semibold">
            {recommendation.name}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {recommendation.code}
          </p>
        </td>
        <td className="px-4 py-4">
          <EligibilityBadge
            recommendation={recommendation}
            minDemandPoints={minDemandPoints}
          />
        </td>
        <td className="px-4 py-4 text-right tabular-nums">
          {recommendation.stockCurrent === null
            ? '—'
            : formatQuantity(recommendation.stockCurrent)}
        </td>
        <td className="px-4 py-4 text-right tabular-nums">
          {formatQuantity(recommendation.demandQuantity)}{' '}
          <span className="text-xs text-muted-foreground">
            / {recommendation.periodDays} d
          </span>
        </td>
        <td className="px-4 py-4 text-right tabular-nums">
          {recommendation.coverageTargetDays} d
        </td>
        <td className="px-4 py-4 text-right tabular-nums">
          {recommendation.targetStock === null
            ? '—'
            : formatQuantity(recommendation.targetStock)}
        </td>
        <td
          className={`px-4 py-4 text-right font-semibold tabular-nums ${
            suggested !== null ? 'text-emerald-700' : 'text-muted-foreground'
          }`}
        >
          {suggested === null ? '—' : formatQuantity(suggested)}
        </td>
        <td className="px-4 py-4 text-right tabular-nums">
          {recommendation.currentCoverageDays === null
            ? '—'
            : formatQuantity(recommendation.currentCoverageDays)}
        </td>
        <td className="px-4 py-4">
          <PriorityBadge priority={recommendation.priority} />
        </td>
        <td className="px-4 py-4 text-right">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`Ver explicación de ${recommendation.name}`}
            onClick={onToggle}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {isExpanded ? (
              <ChevronDown aria-hidden className="size-4" />
            ) : (
              <BadgeHelp aria-hidden className="size-4" />
            )}
            {isExpanded ? 'Ocultar' : 'Por qué'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/40">
          <td colSpan={10} className="px-5 py-4 sm:px-7">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {recommendation.explanation}
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

function EligibilityBadge({
  recommendation,
  minDemandPoints,
}: {
  recommendation: ReplenishmentRecommendation
  minDemandPoints: number
}) {
  if (recommendation.eligible) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Elegible
      </span>
    )
  }

  const label =
    recommendation.reason === 'INACTIVE_PRODUCT'
      ? 'Producto inactivo'
      : recommendation.reason === 'INSUFFICIENT_DATA'
        ? 'Datos insuficientes'
        : recommendation.demandPoints === 0
          ? 'Sin demanda confirmada'
          : `${recommendation.demandPoints} de ${minDemandPoints} registros`

  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      {label}
    </span>
  )
}

function RecommendationsSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando recomendaciones">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="h-3 w-48 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="ml-auto flex gap-3">
            <div className="h-3 w-14 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
          <X className="text-muted" />
        </div>
      ))}
    </div>
  )
}
