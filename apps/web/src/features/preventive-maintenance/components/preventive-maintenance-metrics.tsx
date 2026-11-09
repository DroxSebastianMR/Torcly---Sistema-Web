import { AlertTriangle, BellRing, Car, CheckCircle2 } from 'lucide-react'
import type { PreventiveMaintenanceMetrics } from '../types/preventive-maintenance.types'

interface PreventiveMaintenanceMetricsProps {
  metrics: PreventiveMaintenanceMetrics | undefined
  isLoading?: boolean
}

export function PreventiveMaintenanceMetricsCards({
  metrics,
  isLoading,
}: PreventiveMaintenanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    )
  }

  const critical = metrics?.criticalCount ?? 0
  const warning = metrics?.warningCount ?? 0
  const upToDate = metrics?.upToDateCount ?? 0
  const total = metrics?.totalVehiclesAnalyzed ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <AlertTriangle aria-hidden className="size-6 text-rose-600" />
          <span className="rounded-full bg-rose-200/70 px-2.5 py-0.5 text-xs font-bold text-rose-800">
            {critical > 0 ? 'Atención urgente' : 'Sin atrasos'}
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mantenimiento Vencido
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-rose-700">
          {critical}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Más de 6 meses desde última visita
        </p>
      </article>

      <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <BellRing aria-hidden className="size-6 text-amber-600" />
          <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            Próximos a vencer
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mantenimiento Por Vencer
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-amber-700">
          {warning}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Entre 5 y 6 meses desde última visita
        </p>
      </article>

      <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <CheckCircle2 aria-hidden className="size-6 text-emerald-600" />
          <span className="rounded-full bg-emerald-200/70 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            Al día
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mantenimiento Vigente
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-700">
          {upToDate}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Menos de 5 meses desde última visita
        </p>
      </article>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <Car aria-hidden className="size-6 text-primary" />
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            Parque vehicular
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Total Vehículos Analizados
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-brand-forest">
          {total}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vehículos registrados en tu taller
        </p>
      </article>
    </div>
  )
}
