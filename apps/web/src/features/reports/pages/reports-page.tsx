import { useEffect, useMemo, useRef, useState } from 'react'
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
}

const BLOCK_SEGMENTS: readonly BlockSegmentMeta[] = [
  {
    block: 'sales',
    requiredPermissions: ['sales:read'],
    title: 'Ventas',
    moduleLabel: 'Ver ventas',
    modulePath: paths.sales,
  },
  {
    block: 'payments',
    requiredPermissions: ['cash:read', 'sales:read'],
    title: 'Cobros',
    moduleLabel: 'Ver caja',
    modulePath: paths.cash,
  },
  {
    block: 'inventory',
    requiredPermissions: ['inventory:read'],
    title: 'Inventario',
    moduleLabel: 'Ver inventario',
    modulePath: paths.inventory,
  },
  {
    block: 'services',
    requiredPermissions: ['sales:read', 'services:read'],
    title: 'Servicios',
    moduleLabel: 'Ver servicios',
    modulePath: paths.services,
  },
  {
    block: 'workshop',
    requiredPermissions: ['workshop:read', 'appointments:read'],
    title: 'Taller',
    moduleLabel: 'Ver taller',
    modulePath: paths.workOrders,
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
          Inteligencia de negocio
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
  const { ref, enabled } = useBlockVisibility()
  const block = useReportBlock(meta.block, period, enabled)
  const data = block.data
  return (
    <div ref={ref}>
      <BlockCard
        title={meta.title}
        criteria={data?.descriptor.criteria}
        periodLabel={periodLabel}
        isPending={!enabled || block.isPending}
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
    </div>
  )
}

function useBlockVisibility() {
  const ref = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(
    () => typeof window === 'undefined' || !('IntersectionObserver' in window),
  )

  useEffect(() => {
    if (enabled) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setEnabled(true)
        observer.disconnect()
      },
      { rootMargin: '240px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return { ref, enabled }
}
