import { useDeferredValue, useMemo, useState } from 'react'
import { BadgeCheck, ClipboardList, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { WorkOrderActivityModal } from '../components/work-order-activity-modal'
import { WorkOrderBudgetModal } from '../components/work-order-budget-modal'
import { WorkOrderConsumptionModal } from '../components/work-order-consumption-modal'
import { WorkOrderDecisionModal } from '../components/work-order-decision-modal'
import { WorkOrderDeliveryModal } from '../components/work-order-delivery-modal'
import { WorkOrderDetailModal } from '../components/work-order-detail-modal'
import { WorkOrderDiagnosisModal } from '../components/work-order-diagnosis-modal'
import { WorkOrderReturnModal } from '../components/work-order-return-modal'
import { WorkOrderTechnicianModal } from '../components/work-order-technician-modal'
import { WorkOrdersTable } from '../components/work-orders-table'
import { WorkOrdersToolbar } from '../components/work-orders-toolbar'
import { useQuery } from '@tanstack/react-query'
import {
  workOrderKeys,
  useWorkOrder,
  useWorkOrderExecution,
  useWorkOrders,
  useWorkOrdersMutations,
} from '../hooks/use-work-orders'
import { workOrdersService } from '../services/work-orders.service'
import type {
  WorkOrderDetail,
  WorkOrderFilters,
  WorkOrderSummary,
} from '../types/work-orders.types'
import { getWorkOrderErrorMessage } from '../utils/work-order-formatters'

const initialFilters: WorkOrderFilters = {
  search: '',
  status: 'all',
  technicianId: '',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'workshop:write',
  )
  const mutations = useWorkOrdersMutations()
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [diagnosisTarget, setDiagnosisTarget] =
    useState<WorkOrderDetail | null>(null)
  const [budgetTarget, setBudgetTarget] = useState<WorkOrderDetail | null>(null)
  const [decisionTarget, setDecisionTarget] = useState<WorkOrderDetail | null>(
    null,
  )
  const [technicianTarget, setTechnicianTarget] =
    useState<WorkOrderDetail | null>(null)
  const [activityTarget, setActivityTarget] = useState<WorkOrderDetail | null>(
    null,
  )
  const [consumptionTarget, setConsumptionTarget] =
    useState<WorkOrderDetail | null>(null)
  const [returnTarget, setReturnTarget] = useState<WorkOrderDetail | null>(null)
  const [deliveryTarget, setDeliveryTarget] = useState<WorkOrderDetail | null>(
    null,
  )
  const [startOrder, setStartOrder] = useState<WorkOrderDetail | null>(null)
  const [finalizeOrder, setFinalizeOrder] = useState<WorkOrderDetail | null>(
    null,
  )

  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const orders = useWorkOrders(queryFilters)
  const detail = useWorkOrder(selectedId ?? '')
  const showExecution = useMemo(
    () =>
      detail.data?.status === 'EN_EJECUCION' ||
      detail.data?.status === 'LISTA_PARA_ENTREGA' ||
      detail.data?.status === 'ENTREGADA',
    [detail.data?.status],
  )
  const execution = useWorkOrderExecution(selectedId ?? '', {
    enabled: showExecution,
  })
  const technicians = useQuery({
    queryKey: [...workOrderKeys.all, 'technicians'],
    queryFn: ({ signal }) => workOrdersService.technicians(signal),
    select: (response) => response.data,
  })

  const visibleOrders = useMemo(() => orders.data?.data ?? [], [orders.data])
  const summary = orders.data?.summary
  const total = orders.data?.pagination.total ?? 0

  const suggestions = useMemo(
    () =>
      visibleOrders.map((order) => ({
        value: order.code,
        label: `${order.code} · ${order.customer.name} · ${order.vehicle.plate}`,
        searchTerms: [
          order.code,
          order.appointment.code,
          order.customer.name,
          order.customer.documentNumber,
          order.vehicle.plate,
          order.vehicle.brand,
          order.vehicle.model,
        ],
      })),
    [visibleOrders],
  )

  const openDetail = (order: WorkOrderSummary) => setSelectedId(order.id)

  const handleDiagnosis = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setDiagnosisTarget(order)
  }
  const handleBudget = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setBudgetTarget(order)
  }
  const handleDecide = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setDecisionTarget(order)
  }
  const handleTechnician = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setTechnicianTarget(order)
  }
  const handleActivity = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setActivityTarget(order)
  }
  const handleConsume = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setConsumptionTarget(order)
  }
  const handleReturn = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setReturnTarget(order)
  }
  const handleDeliver = (order: WorkOrderDetail) => {
    setSelectedId(null)
    setDeliveryTarget(order)
  }

  const confirmStart = async () => {
    if (!startOrder) return
    try {
      await mutations.startExecution.mutateAsync(startOrder.id)
      setStartOrder(null)
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
      throw error
    }
  }

  const confirmFinalize = async () => {
    if (!finalizeOrder) return
    try {
      await mutations.finalize.mutateAsync(finalizeOrder.id)
      setFinalizeOrder(null)
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ClipboardList size={15} /> Operación de taller
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Órdenes de taller
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada cita atendida genera una única orden; registra el diagnóstico,
            el presupuesto con precios congelados y el seguimiento de la
            decisión del cliente.
          </p>
        </div>
      </header>

      <section className="relative rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                órdenes encontradas
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-stone-700">
              {summary?.recepcionadas ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">recepcionadas</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-amber-600">
              {summary?.enDiagnostico ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">en diagnóstico</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-sky-600">
              {summary?.pendientesAprobacion ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">pte. aprobación</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {summary?.aprobadas ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">aprobadas</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-violet-700">
              {summary?.enEjecucion ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">en ejecución</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-indigo-700">
              {summary?.listasParaEntrega ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">pta. entrega</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-teal-700">
              {summary?.entregadas ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">entregadas</p>
          </div>
          {orders.isFetching && !orders.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

        <WorkOrdersToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={suggestions}
          technicians={technicians.data ?? []}
        />

        <div className="relative z-0 overflow-hidden rounded-b-2xl">
          {orders.isError ? (
            <ErrorState
              title="No se pudo cargar las órdenes"
              description="Verifica la conexión con la API e inténtalo nuevamente."
              busy={orders.isFetching}
              action={{
                label: 'Reintentar',
                onClick: () => void orders.refetch(),
              }}
            />
          ) : (
            <WorkOrdersTable
              orders={visibleOrders}
              loading={orders.isPending}
              onOpen={openDetail}
            />
          )}

          {orders.data && orders.data.pagination.totalPages > 1 && (
            <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
              <span className="text-muted-foreground">
                Página {filters.page} de {orders.data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={filters.page >= orders.data.pagination.totalPages}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </footer>
          )}
        </div>
      </section>

      <WorkOrderDetailModal
        open={Boolean(selectedId)}
        order={detail.data ?? null}
        loading={detail.isPending}
        canEdit={canWrite}
        execution={execution.data ?? null}
        executionLoading={execution.isPending}
        onClose={() => setSelectedId(null)}
        onDiagnosis={handleDiagnosis}
        onBudget={handleBudget}
        onDecide={handleDecide}
        onTechnician={handleTechnician}
        onStartExecution={setStartOrder}
        onActivity={handleActivity}
        onConsume={handleConsume}
        onReturn={handleReturn}
        onFinalize={setFinalizeOrder}
        onDeliver={handleDeliver}
      />
      <WorkOrderDiagnosisModal
        open={Boolean(diagnosisTarget)}
        order={diagnosisTarget}
        onClose={() => setDiagnosisTarget(null)}
      />
      <WorkOrderBudgetModal
        open={Boolean(budgetTarget)}
        order={budgetTarget}
        onClose={() => setBudgetTarget(null)}
      />
      <WorkOrderDecisionModal
        open={Boolean(decisionTarget)}
        order={decisionTarget}
        onClose={() => setDecisionTarget(null)}
      />
      <WorkOrderTechnicianModal
        open={Boolean(technicianTarget)}
        order={technicianTarget}
        onClose={() => setTechnicianTarget(null)}
      />
      <WorkOrderActivityModal
        open={Boolean(activityTarget)}
        order={activityTarget}
        onClose={() => setActivityTarget(null)}
      />
      <WorkOrderConsumptionModal
        open={Boolean(consumptionTarget)}
        order={consumptionTarget}
        execution={execution.data ?? null}
        onClose={() => setConsumptionTarget(null)}
      />
      <WorkOrderReturnModal
        open={Boolean(returnTarget)}
        order={returnTarget}
        execution={execution.data ?? null}
        onClose={() => setReturnTarget(null)}
      />
      <WorkOrderDeliveryModal
        open={Boolean(deliveryTarget)}
        order={deliveryTarget}
        onClose={() => setDeliveryTarget(null)}
      />
      <ConfirmationDialog
        open={Boolean(startOrder)}
        title="Iniciar la ejecución"
        description={
          startOrder
            ? `La orden ${startOrder.code} pasará a ejecución; a partir de aquí podrás registrar actividades y consumos de repuestos.`
            : undefined
        }
        variant="info"
        icon={Wrench}
        confirmLabel="Iniciar ejecución"
        pending={mutations.startExecution.isPending}
        onConfirm={() => void confirmStart()}
        onCancel={() => setStartOrder(null)}
      />
      <ConfirmationDialog
        open={Boolean(finalizeOrder)}
        title="Finalizar la orden"
        description={
          finalizeOrder
            ? `La orden ${finalizeOrder.code} pasará a lista para entrega y ya no admitirá más consumos ni actividades.`
            : undefined
        }
        variant="info"
        icon={BadgeCheck}
        confirmLabel="Finalizar orden"
        pending={mutations.finalize.isPending}
        onConfirm={() => void confirmFinalize()}
        onCancel={() => setFinalizeOrder(null)}
      />
    </div>
  )
}
