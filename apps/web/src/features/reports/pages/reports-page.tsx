import { useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { paths } from '@/app/router/constants/paths'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission, type Permission } from '@/lib/permissions'
import { BlockCard } from '../components/block-card'
import { PeriodToolbar } from '../components/period-toolbar'
import { BlockContent } from '../components/blocks/block-content'
import { useReportBlock, useReportSummary } from '../hooks/use-reports'
import type { Period, ReportBlock } from '../types/reports.types'
import { defaultPeriod, formatPeriodLabel } from '../utils/report-formatters'

interface BlockSegmentMeta {
  block: ReportBlock
  requiredPermissions: readonly Permission[]
  title: string
  moduleLabel: string
  modulePath: string
  icon: ComponentType<{ 'aria-hidden'?: boolean; className?: string }>
}

const BLOCK_SEGMENTS: readonly BlockSegmentMeta[] = [
  {
    block: 'sales',
    requiredPermissions: ['sales:read'],
    title: 'Ventas',
    moduleLabel: 'Ver ventas',
    modulePath: paths.sales,
    icon: BarChart3,
  },
  {
    block: 'payments',
    requiredPermissions: ['cash:read', 'sales:read'],
    title: 'Cobros',
    moduleLabel: 'Ver caja',
    modulePath: paths.cash,
    icon: BarChart3,
  },
  {
    block: 'inventory',
    requiredPermissions: ['inventory:read'],
    title: 'Inventario',
    moduleLabel: 'Ver inventario',
    modulePath: paths.inventory,
    icon: BarChart3,
  },
  {
    block: 'services',
    requiredPermissions: ['sales:read', 'services:read'],
    title: 'Servicios',
    moduleLabel: 'Ver servicios',
    modulePath: paths.services,
    icon: BarChart3,
  },
  {
    block: 'workshop',
    requiredPermissions: ['workshop:read', 'appointments:read'],
    title: 'Taller',
    moduleLabel: 'Ver taller',
    modulePath: paths.workOrders,
    icon: BarChart3,
  },
]

export default function Page() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>(defaultPeriod)
  const summary = useReportSummary(period)

  const authorized = useMemo(() => {
    const permissions = user?.permissions ?? []
    return BLOCK_SEGMENTS.filter(({ requiredPermissions }) =>
      requiredPermissions.every((required) =>
        hasPermission(permissions, required),
      ),
    )
  }, [user])

  const appliedPeriod = summary.data?.period ?? period
  const periodLabel = formatPeriodLabel(appliedPeriod.from, appliedPeriod.to)

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <BarChart3 size={15} /> Inteligencia de negocio
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Reportes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Indicadores trazables por fuente y criterio. Los bloques consultan los
          módulos de origen y se rehacen al cambiar el período.
        </p>
      </header>

      <PeriodToolbar value={period} onChange={setPeriod} />

      {authorized.length === 0 ? (
        <EmptyState
          className="min-h-72"
          title="Sin reportes disponibles"
          description="Tu usuario no tiene permisos para consultar los módulos que alimentan los reportes."
        />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {authorized.map((meta) => (
            <BlockSegment
              key={meta.block}
              meta={meta}
              period={period}
              periodLabel={periodLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BlockSegment({
  meta,
  period,
  periodLabel,
}: {
  meta: BlockSegmentMeta
  period: Period
  periodLabel: string
}) {
  const block = useReportBlock(meta.block, period)
  const data = block.data
  const Icon = meta.icon
  return (
    <BlockCard
      title={meta.title}
      icon={<Icon aria-hidden className="size-5 text-primary" />}
      criteria={data?.descriptor.criteria}
      source={data?.descriptor.source}
      periodField={data?.descriptor.periodField}
      periodLabel={periodLabel}
      isPending={block.isPending}
      isFetching={block.isFetching}
      isError={block.isError}
      error={block.error}
      hasData={Boolean(data)}
      refetch={() => void block.refetch()}
      modulePath={meta.modulePath}
      moduleLabel={meta.moduleLabel}
    >
      {data && <BlockContent data={data} />}
    </BlockCard>
  )
}
