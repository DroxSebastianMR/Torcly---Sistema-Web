import {
  Users,
  Wrench,
  Package,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkshopSubscription } from '../hooks/use-subscriptions'
import type { SubscriptionStatus } from '../types/subscriptions.types'

const statusBadgeStyles: Record<
  SubscriptionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  ACTIVE: {
    label: 'Suscripción Activa',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  TRIAL: {
    label: 'Período de Prueba',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  PAST_DUE: {
    label: 'Pago Pendiente',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  SUSPENDED: {
    label: 'Suscripción Suspendida',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  CANCELED: {
    label: 'Suscripción Cancelada',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
}

export default function SubscriptionPage() {
  const { data, isLoading, error } = useWorkshopSubscription()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Configuración y Facturación
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Suscripción y Membresía del Taller
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cargando información del plan de tu taller...
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl bg-muted/40"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-xs text-destructive">
        <AlertTriangle className="mx-auto mb-2 size-6" />
        No se pudo cargar la información de suscripción del taller.
      </div>
    )
  }

  const { subscription, plan, usage } = data.data
  const statusBadge = statusBadgeStyles[subscription.status]
  const isCorporateOrMaxPlan =
    plan.code === 'ENTERPRISE' ||
    plan.code === 'CORPORATE' ||
    plan.name.toLowerCase().includes('corporativo') ||
    plan.name.toLowerCase().includes('enterprise')

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Configuración y Facturación
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Suscripción y Membresía del Taller
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consulta los detalles de tu plan contratado, la fecha de renovación
            y el consumo en tiempo real de los límites asignados a tu equipo.
          </p>
        </div>
      </header>

      {/* Tarjeta Principal del Plan Activo */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-emerald-50/20 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {plan.description ||
            'Plan empresarial diseñado para la gestión integral de tu taller.'}
        </p>
      </div>

      {/* Cuotas de Uso en Tiempo Real */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Capacidad y Consumo de Recursos
        </h3>
        <p className="text-xs text-muted-foreground">
          Supervisa el uso actual de usuarios, mecánicos y catálogo de productos
          frente a las cuotas de tu plan.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Miembros */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-brand-forest" />
                <span className="text-xs font-semibold text-foreground">
                  Miembros de Taller
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {usage.members.current} / {usage.members.max}
              </span>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.members.percent >= 90
                      ? 'bg-rose-500'
                      : usage.members.percent >= 75
                        ? 'bg-amber-500'
                        : 'bg-brand-forest'
                  }`}
                  style={{ width: `${usage.members.percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{usage.members.percent}% utilizado</span>
                <span>
                  {Math.max(0, usage.members.max - usage.members.current)}{' '}
                  disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Técnicos */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-brand-forest" />
                <span className="text-xs font-semibold text-foreground">
                  Técnicos Operativos
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {usage.technicians.current} / {usage.technicians.max}
              </span>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.technicians.percent >= 90
                      ? 'bg-rose-500'
                      : usage.technicians.percent >= 75
                        ? 'bg-amber-500'
                        : 'bg-brand-forest'
                  }`}
                  style={{ width: `${usage.technicians.percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{usage.technicians.percent}% utilizado</span>
                <span>
                  {Math.max(
                    0,
                    usage.technicians.max - usage.technicians.current,
                  )}{' '}
                  disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-brand-forest" />
                <span className="text-xs font-semibold text-foreground">
                  Productos en Catálogo
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {usage.products.current} / {usage.products.max}
              </span>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.products.percent >= 90
                      ? 'bg-rose-500'
                      : usage.products.percent >= 75
                        ? 'bg-amber-500'
                        : 'bg-brand-forest'
                  }`}
                  style={{ width: `${usage.products.percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{usage.products.percent}% utilizado</span>
                <span>
                  {Math.max(0, usage.products.max - usage.products.current)}{' '}
                  disponibles
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionalidades Incluidas */}
      {plan.features.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Funcionalidades Incluidas en tu Membresía
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Beneficios activos para la gestión diaria de tu taller bajo el{' '}
            {plan.name}.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {plan.features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground"
              >
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjeta de Soporte y Upgrade (Oculta si ya se encuentra en el plan corporativo / máximo) */}
      {!isCorporateOrMaxPlan && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row">
          <div className="flex items-start gap-3">
            <HelpCircle className="size-5 text-brand-forest shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-emerald-950">
                ¿Tu taller está creciendo y necesitas ampliar tus cuotas?
              </h4>
              <p className="mt-0.5 text-[11px] text-emerald-800">
                Comunícate con el equipo de soporte de Torcly para solicitar una
                ampliación de usuarios, técnicos o migración hacia un Plan
                Corporativo sin interrupción de tus servicios.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href =
                'mailto:soporte@torcly.com?subject=Solicitud%20de%20Upgrade%20de%20Plan%20Torcly'
            }}
            className="border-emerald-300 bg-white text-xs text-brand-forest hover:bg-emerald-50 shrink-0"
          >
            Contactar soporte
          </Button>
        </div>
      )}
    </div>
  )
}
