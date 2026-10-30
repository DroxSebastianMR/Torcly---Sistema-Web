import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { PaginationControls } from '@/components/ui/pagination'
import { paths } from '@/app/router/constants/paths'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission, type Permission } from '@/lib/permissions'
import { BlockCard } from '../components/block-card'
import { PeriodToolbar } from '../components/period-toolbar'
import { BlockContent } from '../components/blocks/block-content'
import {
  useExportReports,
  useReportBlock,
  useReportSummary,
} from '../hooks/use-reports'
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
  const [selectedIndex, setSelectedIndex] = useState(0)
  const summary = useReportSummary(period)
  const exportReports = useExportReports()

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
  const activeIndex = Math.min(
    selectedIndex,
    Math.max(authorized.length - 1, 0),
  )
  const activeMeta = authorized[activeIndex]

  const downloadWorkbook = async () => {
    try {
      const file = await exportReports.mutateAsync(period)
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = `torcly-reportes-${appliedPeriod.from}-${appliedPeriod.to}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Reporte exportado a Excel.')
    } catch {
      toast.error('No se pudo exportar el reporte. Inténtalo nuevamente.')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Inteligencia de negocio
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
          Reportes
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Analiza ventas, cobros, inventario, servicios y taller con datos
          confirmados del período seleccionado.
        </p>
      </header>

      <PeriodToolbar
        value={period}
        onChange={setPeriod}
        onExport={() => void downloadWorkbook()}
        isExporting={exportReports.isPending}
      />

      {authorized.length === 0 ? (
        <EmptyState
          className="min-h-72"
          title="Sin reportes disponibles"
          description="Tu usuario no tiene permisos para consultar los módulos que alimentan los reportes."
        />
      ) : (
        <section aria-label="Carrusel de reportes" className="space-y-4">
          {activeMeta && (
            <BlockSegment
              key={activeMeta.block}
              meta={activeMeta}
              period={period}
              periodLabel={periodLabel}
            />
          )}
          <ReportCarouselNavigation
            activeIndex={activeIndex}
            reports={authorized}
            onChange={setSelectedIndex}
          />
        </section>
      )}
    </div>
  )
}

function ReportCarouselNavigation({
  activeIndex,
  reports,
  onChange,
}: {
  activeIndex: number
  reports: readonly BlockSegmentMeta[]
  onChange: (index: number) => void
}) {
  if (reports.length < 2) return null

  return (
    <nav
      aria-label="Navegación entre áreas de reportes"
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-brand-forest">
          {activeIndex + 1} de {reports.length}
        </span>{' '}
        áreas de análisis
      </p>
      <PaginationControls
        page={activeIndex + 1}
        totalPages={reports.length}
        onPageChange={(page) => onChange(page - 1)}
      />
    </nav>
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
