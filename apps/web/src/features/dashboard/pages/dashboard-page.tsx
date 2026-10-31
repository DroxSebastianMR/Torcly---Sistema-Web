import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  CalendarDays,
  PackageX,
  ReceiptText,
  WalletCards,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { paths } from '@/app/router/constants/paths'
import { cn } from '@/lib/utils'
import {
  useOperationsAttention,
  useOperationsSummary,
} from '../hooks/use-operations'
import type { Attention, Period } from '../types/operations.types'

const dateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = dateKey(new Date())
const weekEnd = new Date()
weekEnd.setDate(weekEnd.getDate() + 6)
const allTime: Period = { from: null, to: null }
const todayPeriod: Period = { from: today, to: today }
const weekPeriod: Period = { from: today, to: dateKey(weekEnd) }

const numberOf = (section: Record<string, unknown> | undefined, key: string) =>
  typeof section?.[key] === 'number' ? section[key] : 0

const currency = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)

const formatDate = (value: unknown) => {
  if (typeof value !== 'string') return 'Fecha por confirmar'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(year, month - 1, day))
}

const activeOrders = (section: Record<string, unknown> | undefined) => {
  const statuses = section?.byStatus
  if (!statuses || typeof statuses !== 'object') return 0
  return Object.entries(statuses as Record<string, unknown>)
    .filter(([status]) => !['ENTREGADA', 'CANCELADA'].includes(status))
    .reduce(
      (total, [, value]) => total + (typeof value === 'number' ? value : 0),
      0,
    )
}

type Tone = 'blue' | 'violet' | 'amber' | 'red'
const tones: Record<Tone, { card: string; icon: string }> = {
  blue: {
    card: 'border-sky-100 bg-gradient-to-br from-white to-sky-50',
    icon: 'text-sky-500',
  },
  violet: {
    card: 'border-violet-100 bg-gradient-to-br from-white to-violet-50',
    icon: 'text-violet-500',
  },
  amber: {
    card: 'border-amber-100 bg-gradient-to-br from-white to-amber-50',
    icon: 'text-amber-500',
  },
  red: {
    card: 'border-rose-100 bg-gradient-to-br from-white to-rose-50',
    icon: 'text-rose-500',
  },
}

function OperationalCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone: Tone
}) {
  const colors = tones[tone]
  return (
    <article
      className={cn(
        'relative min-h-36 overflow-hidden rounded-2xl border p-4 shadow-sm',
        colors.card,
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-10 -bottom-7 size-32 opacity-[0.12]',
          colors.icon,
        )}
      />
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight text-ink')}>
        {value}
      </p>
      <p className="mt-2 text-sm text-ink-muted">{detail}</p>
    </article>
  )
}

function Panel({
  title,
  description,
  path,
  children,
}: {
  title: string
  description: string
  path: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          to={path}
        >
          Ver más <ArrowUpRight className="size-4" />
        </Link>
      </div>
      {children}
    </section>
  )
}

function Agenda({ attention }: { attention: Attention | undefined }) {
  if (!attention?.data.length)
    return (
      <div className="h-[340px]">
        <EmptyState
          title="No hay citas próximas"
          description="Las citas programadas para esta semana aparecerán aquí."
        />
      </div>
    )
  return (
    <ul className="h-[340px] divide-y divide-border overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {attention.data.map((appointment) => (
        <li
          className="flex items-center gap-3 py-3"
          key={String(appointment.code)}
        >
          <div className="flex w-20 shrink-0 flex-col rounded-lg bg-sky-50 px-2 py-1.5 text-center text-xs font-bold text-sky-700">
            <span className="whitespace-nowrap">
              {formatDate(appointment.date)}
            </span>
            <span className="mt-0.5 whitespace-nowrap">
              {String(appointment.time ?? '').slice(0, 5)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">
              {String(appointment.customerName ?? 'Cliente sin nombre')}
            </p>
            <p className="truncate text-sm text-ink-muted">
              {String(appointment.vehiclePlate ?? 'Vehículo por confirmar')} ·{' '}
              {String(appointment.code ?? '')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function AttentionList({ inventory }: { inventory: Attention | undefined }) {
  const rows = [
    ...(inventory?.data.map((item) => ({
      key: `stock-${item.code}`,
      label: String(item.name ?? item.code ?? 'Producto'),
      detail: `Stock: ${String(item.stock ?? 0)} · mínimo ${String(item.minimumStock ?? 0)} ${String(item.unitLabel ?? '')}`,
      meta: `${String(item.stock ?? 0)} disponibles`,
      tone: 'red',
    })) ?? []),
  ]
  if (!rows.length)
    return (
      <div className="h-[340px]">
        <EmptyState
          title="Inventario dentro del mínimo"
          description="No hay productos con stock bajo por el momento."
        />
      </div>
    )
  return (
    <ul className="h-[340px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {rows.map((row) => (
        <li
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-muted',
            'bg-rose-50/50',
          )}
          key={row.key}
        >
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg',
              'bg-rose-100 text-rose-600',
            )}
          >
            <PackageX aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{row.label}</p>
            <p className="truncate text-sm text-ink-muted">{row.detail}</p>
          </div>
          <p
            className={cn(
              'ml-auto shrink-0 text-right text-xs font-semibold',
              'text-rose-700',
            )}
          >
            {row.meta}
          </p>
        </li>
      ))}
    </ul>
  )
}

function RecentActivity({ sales }: { sales: Attention | undefined }) {
  if (!sales?.data.length)
    return (
      <div className="h-[340px]">
        <EmptyState
          title="Aún no hay actividad reciente"
          description="Las ventas confirmadas aparecerán aquí."
        />
      </div>
    )
  return (
    <ul className="h-[340px] divide-y divide-border overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sales.data.map((sale) => (
        <li className="flex items-center gap-3 py-3" key={String(sale.code)}>
          <ReceiptText aria-hidden className="size-5 shrink-0 text-sky-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">
              {String(sale.code ?? 'Venta confirmada')}
            </p>
            <p className="truncate text-sm text-ink-muted">
              {String(sale.customerName ?? 'Venta sin cliente')} ·{' '}
              {formatDate(sale.confirmedAt)}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-emerald-700">
            +{currency(Number(sale.total ?? 0))}
          </p>
        </li>
      ))}
    </ul>
  )
}

function WorkshopOverview({
  workOrders,
}: {
  workOrders: Record<string, unknown> | undefined
}) {
  const statuses =
    workOrders?.byStatus && typeof workOrders.byStatus === 'object'
      ? (workOrders.byStatus as Record<string, unknown>)
      : undefined
  const items = [
    {
      label: 'En diagnóstico',
      value: numberOf(statuses, 'EN_DIAGNOSTICO'),
      dot: 'bg-sky-500',
      valueClass: 'text-sky-700',
    },
    {
      label: 'En ejecución',
      value: numberOf(statuses, 'EN_EJECUCION'),
      dot: 'bg-violet-500',
      valueClass: 'text-violet-700',
    },
    {
      label: 'Entregadas',
      value: numberOf(statuses, 'ENTREGADA'),
      dot: 'bg-emerald-500',
      valueClass: 'text-emerald-700',
    },
  ]
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li className="flex items-center gap-3 py-3" key={item.label}>
          <span
            aria-hidden
            className={cn('size-2 shrink-0 rounded-full', item.dot)}
          />
          <p className="flex-1 text-sm font-medium text-ink">{item.label}</p>
          <p className={cn('text-lg font-bold', item.valueClass)}>
            {item.value}
          </p>
        </li>
      ))}
    </ul>
  )
}

export default function Page() {
  const summary = useOperationsSummary(allTime)
  const todaySummary = useOperationsSummary(todayPeriod)
  const sections = summary.data?.sections ?? {}
  const hasAppointments = Boolean(sections.appointments)
  const hasInventory = Boolean(sections.inventory)
  const hasSales = Boolean(sections.sales)
  const agenda = useOperationsAttention(
    'appointments',
    weekPeriod,
    hasAppointments,
  )
  const inventory = useOperationsAttention('inventory', allTime, hasInventory)
  const sales = useOperationsAttention('sales', allTime, hasSales)

  if (summary.isError)
    return (
      <ErrorState
        title="No se pudo cargar el panel operativo"
        description="Inténtalo nuevamente en unos instantes."
      />
    )
  if (summary.isPending || todaySummary.isPending) return <DashboardSkeleton />

  const pendingPayments = numberOf(sections.payments, 'pendingCount')
  const pendingBalance = numberOf(sections.payments, 'pendingAmount')
  const lowStock = numberOf(sections.inventory, 'lowStockCount')
  const appointmentsToday = numberOf(
    todaySummary.data?.sections.appointments,
    'total',
  )
  const ordersActive = activeOrders(sections.workOrders)
  return (
    <div className="space-y-6">
      <header className="relative flex min-h-28 items-center gap-5">
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-3 w-[min(38rem,90%)] rounded-[50%] bg-primary/10 blur-xl"
        />
        <div className="relative z-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Operación de hoy
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Este es el resumen de lo que necesita atención en tu taller.
          </p>
        </div>
        <div className="relative z-10 hidden shrink-0 sm:block">
          <span className="absolute inset-x-2 -bottom-1 h-3 rounded-[50%] bg-primary/20 blur-md" />
          <img
            alt="Asistente de Torcly"
            className="relative h-24 w-24 object-contain"
            src="/image-robot.png?v=2"
          />
        </div>
      </header>
      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumen operativo"
      >
        <OperationalCard
          label="Citas para hoy"
          value={appointmentsToday}
          detail="Agenda programada hoy"
          icon={CalendarDays}
          tone="blue"
        />
        <OperationalCard
          label="Órdenes activas"
          value={ordersActive}
          detail="En proceso o pendientes"
          icon={Wrench}
          tone="violet"
        />
        <OperationalCard
          label="Cobros pendientes"
          value={pendingPayments}
          detail={
            pendingBalance
              ? `${currency(pendingBalance)} por cobrar`
              : 'Sin saldos pendientes'
          }
          icon={WalletCards}
          tone="amber"
        />
        <OperationalCard
          label="Stock bajo"
          value={lowStock}
          detail={
            lowStock
              ? 'Productos requieren reposición'
              : 'Inventario dentro del mínimo'
          }
          icon={PackageX}
          tone="red"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Próximas citas"
          description="Agenda programada para los siguientes 7 días."
          path={paths.appointments}
        >
          <Agenda attention={agenda.data} />
        </Panel>
        {hasInventory && (
          <Panel
            title="Inventario por revisar"
            description="Productos que están por debajo de su stock mínimo."
            path={paths.inventory}
          >
            <AttentionList inventory={inventory.data} />
          </Panel>
        )}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        {hasSales && (
          <Panel
            title="Actividad reciente"
            description="Últimas ventas confirmadas en el taller."
            path={paths.sales}
          >
            <RecentActivity sales={sales.data} />
          </Panel>
        )}
        <Panel
          title="Estado del taller"
          description="Distribución actual de las órdenes en proceso."
          path={paths.workOrders}
        >
          <WorkshopOverview workOrders={sections.workOrders} />
        </Panel>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Cargando panel operativo">
      <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-36 animate-pulse rounded-2xl bg-surface-muted"
            key={index}
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-surface-muted" />
      </div>
    </div>
  )
}
