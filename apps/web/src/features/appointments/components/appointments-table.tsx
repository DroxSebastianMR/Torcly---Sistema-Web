import { CalendarDays, Car, MoreHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type {
  Appointment,
  AppointmentStatus,
} from '../types/appointments.types'
import {
  appointmentStatusLabel,
  appointmentVehicleLabel,
  formatAppointmentSchedule,
} from '../utils/appointment-formatters'

interface AppointmentsTableProps {
  appointments: Appointment[]
  loading: boolean
  onOpen: (appointment: Appointment) => void
}

export function AppointmentsTable({
  appointments,
  loading,
  onOpen,
}: AppointmentsTableProps) {
  if (loading) return <AppointmentsSkeleton />

  if (!appointments.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No se encontraron citas"
        description="Ajusta los filtros o registra la primera cita."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Cita</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Programada</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="group cursor-pointer hover:bg-[#f9fbfa]"
                onClick={() => onOpen(appointment)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <CalendarDays size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {appointment.code}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {appointment.performedBy}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-48 px-4 py-4">
                  <p className="truncate">
                    {appointment.customer?.name ?? 'Sin cliente'}
                  </p>
                  {appointment.customer && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {appointment.customer.documentNumber}
                    </p>
                  )}
                </td>
                <td className="max-w-52 px-4 py-4">
                  <p className="flex items-center gap-1.5 truncate">
                    <Car
                      aria-hidden
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">
                      {appointmentVehicleLabel(appointment)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {appointment.vehicle.brand} {appointment.vehicle.model} ·{' '}
                    {appointment.vehicle.year}
                  </p>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatAppointmentSchedule(
                    appointment.date,
                    appointment.time,
                  )}
                </td>
                <td className="max-w-56 px-4 py-4">
                  <p className="line-clamp-2">{appointment.reason}</p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={appointment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="px-4 py-4"
            onClick={() => onOpen(appointment)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{appointment.code}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {appointment.customer?.name ?? 'Sin cliente'}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="text-muted-foreground">
                Vehículo:{' '}
                <span className="text-foreground">
                  {appointmentVehicleLabel(appointment)}
                </span>
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatAppointmentSchedule(appointment.date, appointment.time)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const tone =
    status === 'PROGRAMADA'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'ATENDIDA'
        ? 'bg-sky-50 text-sky-700'
        : 'bg-rose-50 text-rose-700'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {appointmentStatusLabel(status)}
    </span>
  )
}

function AppointmentsSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando citas">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-44 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
