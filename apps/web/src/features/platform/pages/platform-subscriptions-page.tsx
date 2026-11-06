import { useState, useDeferredValue, useMemo } from 'react'
import {
  CreditCard,
  Crown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Pencil,
  Plus,
  Layers,
  Check,
  Users,
  Wrench,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { SmartSelect } from '@/components/ui/smart-select'
import { usePlatformOrganizations } from '@/features/platform/hooks/use-platform-organizations'
import { PlanFormModal } from '@/features/subscriptions/components/plan-form-modal'
import { SubscriptionAssignModal } from '@/features/subscriptions/components/subscription-assign-modal'
import { SubscriptionEditModal } from '@/features/subscriptions/components/subscription-edit-modal'
import {
  useAssignSubscription,
  useCreatePlan,
  usePlatformPlans,
  usePlatformSubscriptionMetrics,
  usePlatformSubscriptions,
  useUpdatePlan,
  useUpdatePlatformSubscription,
} from '@/features/subscriptions/hooks/use-subscriptions'
import type {
  AssignSubscriptionInput,
  CreatePlanInput,
  OrganizationSubscription,
  Plan,
  PlatformSubscriptionFilters,
  SubscriptionStatus,
  UpdatePlanInput,
  UpdatePlatformSubscriptionInput,
} from '@/features/subscriptions/types/subscriptions.types'

const initialFilters: PlatformSubscriptionFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

const statusBadgeStyles: Record<
  SubscriptionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  ACTIVE: {
    label: 'Activa',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  TRIAL: {
    label: 'En prueba',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  PAST_DUE: {
    label: 'Vencida',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  SUSPENDED: {
    label: 'Suspendida',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  CANCELED: {
    label: 'Cancelada',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
}

export default function PlatformSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>(
    'subscriptions',
  )
  const [filters, setFilters] =
    useState<PlatformSubscriptionFilters>(initialFilters)
  const [editingSubscription, setEditingSubscription] =
    useState<OrganizationSubscription | null>(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [planModalState, setPlanModalState] = useState<{
    open: boolean
    plan: Plan | null
  }>({
    open: false,
    plan: null,
  })

  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters],
  )

  const { data: metricsData, isLoading: metricsLoading } =
    usePlatformSubscriptionMetrics()
  const { data: plansData, isLoading: plansLoading } = usePlatformPlans()
  const { data: subscriptionsData, isLoading: subscriptionsLoading } =
    usePlatformSubscriptions(queryFilters)
  const { data: organizationsData } = usePlatformOrganizations({
    search: '',
    status: 'all',
    page: 1,
    pageSize: 100,
  })

  const updateMutation = useUpdatePlatformSubscription()
  const assignMutation = useAssignSubscription()
  const createPlanMutation = useCreatePlan()
  const updatePlanMutation = useUpdatePlan()

  const metrics = metricsData?.data
  const plans = plansData?.data ?? []
  const subscriptions = subscriptionsData?.data ?? []
  const organizations = organizationsData?.data ?? []
  const pagination = subscriptionsData?.pagination

  const updateFilters = (next: Partial<PlatformSubscriptionFilters>) => {
    setFilters((current) => ({
      ...current,
      ...next,
      ...(next.search !== undefined ||
      next.status !== undefined ||
      next.planCode !== undefined
        ? { page: 1 }
        : {}),
    }))
  }

  const handleUpdate = async (
    organizationId: string,
    input: UpdatePlatformSubscriptionInput,
  ) => {
    try {
      await updateMutation.mutateAsync({ organizationId, input })
      setEditingSubscription(null)
      toast.success('Suscripción actualizada correctamente.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la suscripción.',
      )
    }
  }

  const handleAssign = async (input: AssignSubscriptionInput) => {
    try {
      await assignMutation.mutateAsync(input)
      setAssignModalOpen(false)
      toast.success('Membresía asignada exitosamente al taller.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo asignar la membresía al taller.',
      )
    }
  }

  const handleCreatePlan = async (input: CreatePlanInput) => {
    try {
      await createPlanMutation.mutateAsync(input)
      setPlanModalState({ open: false, plan: null })
      toast.success('Plan comercial creado correctamente.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo crear el plan.',
      )
    }
  }

  const handleUpdatePlan = async (planId: string, input: UpdatePlanInput) => {
    try {
      await updatePlanMutation.mutateAsync({ planId, input })
      setPlanModalState({ open: false, plan: null })
      toast.success('Plan comercial actualizado correctamente.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el plan.',
      )
    }
  }

  const statusFilterOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'ACTIVE', label: 'Activas' },
    { value: 'TRIAL', label: 'En prueba' },
    { value: 'PAST_DUE', label: 'Vencidas' },
    { value: 'SUSPENDED', label: 'Suspendidas' },
    { value: 'CANCELED', label: 'Canceladas' },
  ]

  const planFilterOptions = [
    { value: '', label: 'Todos los planes' },
    ...plans.map((p) => ({ value: p.code, label: p.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-forest">
            Consola de Administración SaaS
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Suscripciones y Membresías
          </h1>
          <p className="text-xs text-muted-foreground">
            Supervisión de planes comerciales contratados, vigencias de
            facturación y control de recursos para cada taller.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'subscriptions' ? (
            <Button
              onClick={() => setAssignModalOpen(true)}
              className="gap-1.5 bg-brand-forest text-xs text-white hover:bg-brand-forest/90"
            >
              <Plus className="size-4" />
              Asignar Membresía
            </Button>
          ) : (
            <Button
              onClick={() => setPlanModalState({ open: true, plan: null })}
              className="gap-1.5 bg-brand-forest text-xs text-white hover:bg-brand-forest/90"
            >
              <Plus className="size-4" />
              Nuevo Plan
            </Button>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'border-brand-forest font-semibold text-brand-forest'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="size-4" />
          Membresías de Talleres
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'plans'
              ? 'border-brand-forest font-semibold text-brand-forest'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="size-4" />
          Planes Comerciales ({plans.length})
        </button>
      </div>

      {activeTab === 'subscriptions' ? (
        <div className="space-y-6">
          {/* Métricas de Plataforma */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Talleres
                </span>
                <Building2 className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {metricsLoading ? '...' : (metrics?.total ?? 0)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Suscripciones Activas
                </span>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {metricsLoading ? '...' : (metrics?.active ?? 0)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  En Prueba
                </span>
                <Clock className="size-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {metricsLoading ? '...' : (metrics?.trial ?? 0)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Vencidas o Suspendidas
                </span>
                <AlertTriangle className="size-4 text-rose-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700">
                {metricsLoading
                  ? '...'
                  : (metrics?.pastDue ?? 0) + (metrics?.suspended ?? 0)}
              </p>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Buscar por taller o código de organización..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44">
                <SmartSelect
                  value={filters.status ?? 'all'}
                  onChange={(status) =>
                    updateFilters({
                      status: status as PlatformSubscriptionFilters['status'],
                    })
                  }
                  options={statusFilterOptions}
                  aria-label="Filtrar por estado"
                />
              </div>

              <div className="w-48">
                <SmartSelect
                  value={filters.planCode ?? ''}
                  onChange={(planCode) =>
                    updateFilters({ planCode: planCode || undefined })
                  }
                  options={planFilterOptions}
                  aria-label="Filtrar por plan"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Suscripciones */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {subscriptionsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Cargando suscripciones de plataforma...
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <CreditCard className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="font-medium text-foreground">
                  No se encontraron suscripciones registradas
                </p>
                <p className="mt-1 text-muted-foreground">
                  Asigna una membresía inicial a los talleres existentes para
                  comenzar a supervisarlos.
                </p>
                <Button
                  onClick={() => setAssignModalOpen(true)}
                  className="mt-4 gap-1.5 bg-brand-forest text-xs text-white hover:bg-brand-forest/90"
                >
                  <Plus className="size-3.5" />
                  Asignar Primera Membresía
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Taller / Código</th>
                      <th className="px-4 py-3 font-medium">Plan Comercial</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Ciclo</th>
                      <th className="px-4 py-3 font-medium">
                        Próxima Renovación
                      </th>
                      <th className="px-4 py-3 font-medium">Cuotas Máximas</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subscriptions.map((sub) => {
                      const badge = statusBadgeStyles[sub.status]
                      const renewalFormatted = sub.renewsAt
                        ? new Date(sub.renewsAt).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Sin corte'

                      return (
                        <tr
                          key={sub.id}
                          className="transition-colors hover:bg-muted/10"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-brand-forest">
                              {sub.organizationName}
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {sub.organizationCode}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Crown className="size-3.5 text-brand-forest" />
                              {sub.plan.name}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {sub.billingCycle === 'ANNUAL'
                              ? 'Anual'
                              : 'Mensual'}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {renewalFormatted}
                          </td>

                          <td className="px-4 py-3 text-[11px] text-muted-foreground">
                            {sub.plan.maxMembers} miembros ·{' '}
                            {sub.plan.maxTechnicians} técnicos
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSubscription(sub)}
                              className="h-7 gap-1 text-xs"
                            >
                              <Pencil className="size-3" />
                              Gestionar
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="border-t border-border p-3">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => updateFilters({ page })}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Vista de Planes Comerciales */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Configura las cuotas operativas de miembros, técnicos, catálogo y
              las tarifas de suscripción vigentes.
            </p>
          </div>

          {plansLoading ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              Cargando planes comerciales...
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
              <Layers className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="font-medium text-foreground">
                No existen planes comerciales configurados
              </p>
              <Button
                onClick={() => setPlanModalState({ open: true, plan: null })}
                className="mt-4 gap-1.5 bg-brand-forest text-xs text-white hover:bg-brand-forest/90"
              >
                <Plus className="size-3.5" />
                Crear Primer Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Header del Plan */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-brand-forest">
                            {plan.code}
                          </span>
                          {!plan.active && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
                              Inactivo
                            </span>
                          )}
                          {!plan.isPublic && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                              Oculto
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 flex items-center gap-1.5 text-base font-bold text-foreground">
                          <Crown className="size-4 text-brand-forest shrink-0" />
                          {plan.name}
                        </h3>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {/* Precios */}
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">
                          S/ {plan.priceMonthly}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / mes
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        o{' '}
                        <strong className="text-foreground">
                          S/ {plan.priceYearly}
                        </strong>{' '}
                        facturado anualmente
                      </div>
                    </div>

                    {/* Cuotas Máximas */}
                    <div className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-xs">
                      <span className="block font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Cuotas máximas del sistema
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 pt-1 text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-brand-forest" />
                            Miembros de taller:
                          </span>
                          <span className="font-semibold text-foreground">
                            {plan.maxMembers}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Wrench className="size-3.5 text-brand-forest" />
                            Mecánicos / Técnicos:
                          </span>
                          <span className="font-semibold text-foreground">
                            {plan.maxTechnicians}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Package className="size-3.5 text-brand-forest" />
                            Productos en catálogo:
                          </span>
                          <span className="font-semibold text-foreground">
                            {plan.maxProducts}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Beneficios */}
                    {plan.features.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="block font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                          Funcionalidades incluidas
                        </span>
                        <ul className="space-y-1 text-xs text-foreground/80">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="size-3.5 text-brand-forest shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="mt-5 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPlanModalState({ open: true, plan: plan })
                      }
                      className="w-full gap-1.5 text-xs"
                    >
                      <Pencil className="size-3.5" />
                      Editar Plan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Asignación de Membresía */}
      <SubscriptionAssignModal
        open={assignModalOpen}
        organizations={organizations}
        plans={plans}
        busy={assignMutation.isPending}
        onClose={() => setAssignModalOpen(false)}
        onSubmit={handleAssign}
      />

      {/* Modal de Creación / Edición de Plan Comercial */}
      <PlanFormModal
        open={planModalState.open}
        plan={planModalState.plan}
        busy={createPlanMutation.isPending || updatePlanMutation.isPending}
        onClose={() => setPlanModalState({ open: false, plan: null })}
        onSubmitCreate={handleCreatePlan}
        onSubmitUpdate={handleUpdatePlan}
      />

      {/* Modal de Gestión de Suscripción Existente */}
      {editingSubscription && (
        <SubscriptionEditModal
          subscription={editingSubscription}
          plans={plans}
          busy={updateMutation.isPending}
          onClose={() => setEditingSubscription(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  )
}
