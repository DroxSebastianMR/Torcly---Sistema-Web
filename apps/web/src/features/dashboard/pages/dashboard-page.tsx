import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Package,
  ReceiptText,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { paths } from '@/app/router/constants/paths'
import {
  useOperationsAttention,
  useOperationsSummary,
} from '../hooks/use-operations'
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
  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Activity size={15} /> Consulta operativa
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resumen trazable de la operación actual. Todas las acciones abren su
          módulo de origen.
        </p>
      </header>
      <section className="flex flex-wrap gap-3 rounded-2xl border bg-card p-4">
        <label className="text-sm">
          Desde
          <input
            className="ml-2 rounded border p-2"
            type="date"
            value={period.from ?? ''}
            onChange={(e) =>
              setPeriod((current) => ({
                ...current,
                from: e.target.value || null,
              }))
            }
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            className="ml-2 rounded border p-2"
            type="date"
            value={period.to ?? ''}
            onChange={(e) =>
              setPeriod((current) => ({
                ...current,
                to: e.target.value || null,
              }))
            }
          />
        </label>
        <Button
          variant="outline"
          onClick={() => setPeriod({ from: null, to: null })}
        >
          Limpiar
        </Button>
      </section>
      {summary.isError ? (
        <ErrorState
          title="No se pudo cargar la consulta operativa"
          action={{
            label: 'Reintentar',
            onClick: () => void summary.refetch(),
          }}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!summary.data && (
            <p className="text-sm text-muted-foreground">
              Cargando resumen operativo…
            </p>
          )}
          {sections
            .filter(({ key }) => Boolean(summary.data?.sections[key]))
            .map(({ key, path, icon: Icon }) => (
              <SummaryCard
                key={key}
                section={key}
                path={path}
                Icon={Icon}
                period={period}
                summary={summary.data?.sections[key]}
                label={summary.data?.descriptors[key]?.label ?? key}
              />
            ))}
        </section>
      )}
    </div>
  )
}

function SummaryCard({
  section,
  path,
  Icon,
  period,
  summary,
  label,
}: {
  section: OperationalSection
  path: string
  Icon: typeof Activity
  period: { from: string | null; to: string | null }
  summary: Record<string, unknown> | undefined
  label: string
}) {
  const attention = useOperationsAttention(section, period)
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
  return (
    <article className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-muted p-3 text-primary">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{summary ? total : '…'}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {attention.isPending
          ? 'Cargando atención…'
          : attention.data?.data.length
            ? `${attention.data.data.length} elemento(s) requieren atención.`
            : 'Sin elementos que requieran atención.'}
      </p>
      <Link
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        to={path}
      >
        Ver módulo <ArrowRight size={15} />
      </Link>
    </article>
  )
}
