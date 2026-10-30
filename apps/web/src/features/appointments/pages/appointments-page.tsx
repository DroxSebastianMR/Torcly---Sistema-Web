import { useDeferredValue, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { customerDisplayName } from '@/features/customers/utils/customer-formatters'
import { workOrderKeys } from '@/features/work-orders/hooks/use-work-orders'
import { workOrdersService } from '@/features/work-orders/services/work-orders.service'
import { hasPermission } from '@/lib/permissions'
import { useQueryClient } from '@tanstack/react-query'
import { AppointmentDetailModal } from '../components/appointment-detail-modal'
import { AppointmentFormModal } from '../components/appointment-form-modal'
import { AppointmentsTable } from '../components/appointments-table'
import { AppointmentsToolbar } from '../components/appointments-toolbar'
import {
  appointmentKeys,
  useAppointment,
  useAppointmentMutations,
  useAppointments,
} from '../hooks/use-appointments'
import type {
  Appointment,
  AppointmentFilters,
} from '../types/appointments.types'
import { getAppointmentErrorMessage } from '../utils/appointment-formatters'

const initialFilters: AppointmentFilters = {
  search: '',
  date: '',
  customerId: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'appointments:write',
  )
  const canAttend = hasPermission(
    currentUser?.permissions ?? [],
    'workshop:write',
  )
  const queryClient = useQueryClient()
  const mutations = useAppointmentMutations()
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  )
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [attendTarget, setAttendTarget] = useState<Appointment | null>(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const appointments = useAppointments(queryFilters)
  const detail = useAppointment(selectedId ?? '')
  const customers = useCustomers({
    search: '',
    type: 'all',
    page: 1,
    pageSize: 100,
  })

  const visibleAppointments = useMemo(
    () => appointments.data?.data ?? [],
    [appointments.data],
  )
  const summary = appointments.data?.summary
  const total = appointments.data?.pagination.total ?? 0

  const customerOptions = useMemo(
    () =>
      (customers.data?.data ?? []).map((customer) => ({
        value: customer.id,
        label: `${customerDisplayName(customer)} · ${customer.documentNumber}`,
        searchTerms: [
          customer.documentNumber,
          customer.phone,
          customerDisplayName(customer),
        ],
      })),
    [customers.data],
  )

  const suggestions = useMemo(
    () =>
      visibleAppointments.map((appointment) => ({
        value: appointment.code,
        label: `${appointment.code} · ${appointment.customer?.name ?? 'Sin cliente'}`,
        searchTerms: [
          appointment.code,
          appointment.customer?.name ?? '',
          appointment.customer?.documentNumber ?? '',
          appointment.vehicle.plate,
          appointment.vehicle.brand,
          appointment.vehicle.model,
          appointment.reason,
          appointment.date,
        ],
      })),
    [visibleAppointments],
  )

  const openDetail = (appointment: Appointment) => {
    setSelectedId(appointment.id)
  }

  const reschedule = (appointment: Appointment) => {
    setSelectedId(null)
    setRescheduleTarget(appointment)
  }

  const cancelAppointment = async () => {
    if (!cancelTarget) return
    try {
      await mutations.cancel.mutateAsync(cancelTarget.id)
      toast.success(`Cita ${cancelTarget.code} cancelada.`)
      setCancelTarget(null)
      setSelectedId(null)
    } catch (error) {
      toast.error(getAppointmentErrorMessage(error))
    }
  }

  const attendAppointment = async () => {
    if (!attendTarget) return
    try {
      const result = await workOrdersService.createFromAppointment(
        attendTarget.id,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
        queryClient.invalidateQueries({ queryKey: workOrderKeys.all }),
      ])
      toast.success(
        `Cita ${attendTarget.code} atendida. Orden ${result.data.code} creada.`,
      )
      setAttendTarget(null)
      setSelectedId(null)
    } catch (error) {
      toast.error(getAppointmentErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Agenda del taller
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Citas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Programa citas de atención por cliente y vehículo; se permiten hasta
            8 citas activas por fecha y hora.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setRescheduleTarget(null)
              setCreateOpen(true)
            }}
          >
            <Plus size={17} /> Nueva cita
          </Button>
        )}
      </header>

      <ModuleMetrics
        items={[
          { label: 'Citas encontradas', value: total },
          { label: 'para hoy', value: summary?.hoy ?? 0, tone: 'info' },
          {
            label: 'Programadas',
            value: summary?.programadas ?? 0,
            tone: 'success',
          },
          {
            label: 'Canceladas',
            value: summary?.canceladas ?? 0,
            tone: 'danger',
          },
        ]}
      />

      <section
        aria-label="Filtros de citas"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <AppointmentsToolbar
          filters={filters}
          onChange={setFilters}
          customerOptions={customerOptions}
          suggestions={suggestions}
        />
      </section>

      <section
        aria-label="Resultados de citas"
        className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        <div className="relative z-0 overflow-hidden">
          {appointments.isError ? (
            <ErrorState
              title="No se pudo cargar las citas"
              description="Verifica la conexión con la API e inténtalo nuevamente."
              busy={appointments.isFetching}
              action={{
                label: 'Reintentar',
                onClick: () => void appointments.refetch(),
              }}
            />
          ) : (
            <AppointmentsTable
              appointments={visibleAppointments}
              loading={appointments.isPending}
              onOpen={openDetail}
            />
          )}

          {appointments.data && (
            <Pagination
              page={filters.page}
              totalPages={appointments.data.pagination.totalPages}
              onPageChange={(page) =>
                setFilters((current) => ({ ...current, page }))
              }
            />
          )}
        </div>
      </section>

      <AppointmentDetailModal
        open={Boolean(selectedId)}
        appointment={detail.data ?? null}
        loading={detail.isPending}
        canWrite={canWrite}
        canAttend={canAttend}
        onClose={() => setSelectedId(null)}
        onReschedule={reschedule}
        onCancel={setCancelTarget}
        onAttend={setAttendTarget}
      />
      <AppointmentFormModal
        open={createOpen || Boolean(rescheduleTarget)}
        mode={rescheduleTarget ? 'reschedule' : 'create'}
        appointment={rescheduleTarget}
        onClose={() => {
          setCreateOpen(false)
          setRescheduleTarget(null)
        }}
      />
      <ConfirmationDialog
        open={Boolean(cancelTarget)}
        variant="danger"
        title="Cancelar cita"
        description={
          cancelTarget
            ? `La cita ${cancelTarget.code} pasará a estado cancelada y liberará el horario para nuevas citas. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Cancelar cita"
        onConfirm={cancelAppointment}
        onCancel={() => setCancelTarget(null)}
      />
      <ConfirmationDialog
        open={Boolean(attendTarget)}
        variant="info"
        title="Atender cita y crear orden"
        description={
          attendTarget
            ? 'La cita se marcará como atendida y se creará su orden de taller.'
            : undefined
        }
        confirmLabel="Crear orden"
        onConfirm={attendAppointment}
        onCancel={() => setAttendTarget(null)}
      />
    </div>
  )
}
