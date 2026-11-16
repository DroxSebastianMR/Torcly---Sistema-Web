import { ModuleMetrics } from '@/components/ui/module-metrics'
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-h-[132px] animate-pulse rounded-[22px] border border-[#e2ebe6] bg-card"
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
    <ModuleMetrics
      items={[
        {
          label: 'Mantenimiento vencido',
          value: critical,
          tone: 'danger',
          description:
            critical > 0
              ? 'Más de 6 meses sin servicio'
              : 'Sin atrasos críticos',
        },
        {
          label: 'Por vencer',
          value: warning,
          tone: 'warning',
          description: 'Entre 5 y 6 meses sin servicio',
        },
        {
          label: 'Mantenimiento al día',
          value: upToDate,
          tone: 'success',
          description: 'Menos de 5 meses sin servicio',
        },
        {
          label: 'Total analizados',
          value: total,
          tone: 'default',
          description: 'Vehículos con historial en taller',
        },
      ]}
    />
  )
}
