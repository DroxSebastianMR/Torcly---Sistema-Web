import { CalendarDays, Car, Pencil, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { Appointment } from '../types/appointments.types'
import {
  appointmentStatusLabel,
  appointmentVehicleLabel,
  formatAppointmentSchedule,
} from '../utils/appointment-formatters'

interface AppointmentDetailModalProps {
  open: boolean
  appointment: Appointment | null
  loading: boolean
  canWrite: boolean
  onClose: () => void
  onReschedule: (appointment: Appointment) => void
  onCancel: (appointment: Appointment) => void
}

export function AppointmentDetailModal({
  open,
  appointment,
  loading,
  canWrite,
  onClose,
  onReschedule,
  onCancel,
}: AppointmentDetailModalProps) {
  const isProgrammed = appointment?.status === 'PROGRAMADA'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment?.code ?? 'Detalle de cita'}
      description={
        appointment
          ? `Cita ${appointmentStatusLabel(appointment.status).toLowerCase()}`
          : undefined
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isProgrammed && canWrite && appointment && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onCancel(appointment)}
              >
                <X size={16} /> Cancelar cita
              </Button>
              <Button type="button" onClick={() => onReschedule(appointment)}>
                <Pencil size={16} /> Reprogramar
              </Button>
            </>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {loading || !appointment ? (
        <DetailSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={<UserRound aria-hidden size={15} />}
              label="Cliente"
              value={
                appointment.customer
                  ? `${appointment.customer.name} · ${appointment.customer.documentNumber}`
                  : 'Sin cliente'
              }
            />
            <InfoItem
              icon={<Car aria-hidden size={15} />}
              label="Vehículo"
              value={appointmentVehicleLabel(appointment)}
            />
            <InfoItem
              icon={<CalendarDays aria-hidden size={15} />}
              label="Programada"
              value={formatAppointmentSchedule(
                appointment.date,
                appointment.time,
              )}
            />
            <InfoItem label="Registrada por" value={appointment.performedBy} />
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Motivo
            </p>
            <p className="mt-1 text-sm font-medium break-words">
              {appointment.reason}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {appointment.rescheduledAt && (
              <InfoItem
                label="Reprogramada"
                value={
                  appointment.rescheduledBy
                    ? `${appointment.rescheduledBy} · ${dateTimeFormatter.format(
                        new Date(appointment.rescheduledAt),
                      )}`
                    : dateTimeFormatter.format(
                        new Date(appointment.rescheduledAt),
                      )
                }
              />
            )}
            {appointment.cancelledAt && (
              <InfoItem
                label="Cancelada"
                value={
                  appointment.cancelledBy
                    ? `${appointment.cancelledBy} · ${dateTimeFormatter.format(
                        new Date(appointment.cancelledAt),
                      )}`
                    : dateTimeFormatter.format(
                        new Date(appointment.cancelledAt),
                      )
                }
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando cita">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-12 w-40 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
