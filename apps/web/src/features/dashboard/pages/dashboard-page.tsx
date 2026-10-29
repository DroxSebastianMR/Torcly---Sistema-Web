import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Inbox,
  Package,
  ReceiptText,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { KpiCard } from '@/components/ui/kpi-card'
import { paths } from '@/app/router/constants/paths'
import { useOperationsSummary } from '../hooks/use-operations'
import { AssistantChat } from '@/features/assistant/components/assistant-chat'
import type { OperationalSection } from '../types/operations.types'

const sections: Array<{
  key: OperationalSection
  path: string
  icon: typeof Activity
}> = [
  { key: 'appointments', path: paths.appointments, icon: CalendarDays },
  { key: 'workOrders', path: paths.workOrders, icon: Wrench },
  { key: 'sales', path: paths.sales, icon: ReceiptText },
  { key: 'payments', path: paths.cash, icon: ReceiptText },
  { key: 'inventory', path: paths.inventory, icon: Package },
]

export default function Page() {
  const [period, setPeriod] = useState({
    from: null as string | null,
    to: null as string | null,
  })
  const summary = useOperationsSummary(period)
  const visibleSections = sections.filter(({ key }) =>
    Boolean(summary.data?.sections[key]),
  )
  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Consulta operativa
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resumen trazable de la operación actual. Todas las acciones abren su
          módulo de origen.
        </p>
      </header>
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <DateRangePicker
          aria-label="Filtrar dashboard por período"
          value={{ from: period.from ?? '', to: period.to ?? '' }}
          onChange={(range) =>
            setPeriod({ from: range.from || null, to: range.to || null })
          }
          className="w-full sm:w-80"
        />
        <p className="w-full text-xs text-muted-foreground sm:w-auto sm:self-center">
          Los filtros de fecha ajustan la consulta operativa.
        </p>
      </section>
      <AssistantChat period={period} />
      {summary.isError ? (
        <ErrorState
          title="No se pudo cargar la consulta operativa"
          action={{
            label: 'Reintentar',
            onClick: () => void summary.refetch(),
          }}
        />
      ) : !summary.data ? (
        <DashboardSkeleton />
      ) : visibleSections.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin información operativa"
          description="No hay datos de operación disponibles para el periodo seleccionado. Ajusta las fechas o inténtalo más tarde."
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSections.map(({ key, path, icon: Icon }) => (
            <SummaryCard
              key={key}
              path={path}
              Icon={Icon}
              summary={summary.data?.sections[key]}
              label={summary.data?.descriptors[key]?.label ?? key}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando resumen operativo"
      aria-live="polite"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 animate-pulse rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-7 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-5 h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-5 h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function SummaryCard({
  path,
  Icon,
  summary,
  label,
}: {
  path: string
  Icon: typeof Activity
  summary: Record<string, unknown> | undefined
  label: string
}) {
  const total =
    typeof summary?.total === 'number'
      ? summary.total
      : typeof summary?.pendingCount === 'number'
        ? summary.pendingCount
        : typeof summary?.lowStockCount === 'number'
          ? summary.lowStockCount
          : typeof summary?.confirmedCount === 'number'
            ? summary.confirmedCount
            : 0
  const attentionCount =
    typeof summary?.attentionCount === 'number'
      ? summary.attentionCount
      : typeof summary?.pendingCount === 'number'
        ? summary.pendingCount
        : typeof summary?.lowStockCount === 'number'
          ? summary.lowStockCount
          : typeof summary?.confirmedCount === 'number'
            ? summary.confirmedCount
            : 0
  return (
    <article className="rounded-2xl border bg-card shadow-[0_8px_24px_rgb(16_44_37_/_6%)]">
      <KpiCard
        className="border-0 bg-transparent shadow-none"
        icon={<Icon size={24} />}
        label={label}
        value={summary ? total : '…'}
        detail={
          attentionCount > 0
            ? `${attentionCount} elemento(s) requieren atención.`
            : 'Sin elementos que requieran atención.'
        }
      />
      <div className="px-6 pb-5">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-150 hover:translate-x-0.5"
          to={path}
        >
          Ver módulo <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
