import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { CalendarClock, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { TimePicker } from '@/components/ui/time-picker'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { customerDisplayName } from '@/features/customers/utils/customer-formatters'
import { vehicleKeys } from '@/features/vehicles/hooks/use-vehicles'
import { vehiclesService } from '@/features/vehicles/services/vehicles.service'
import {
  appointmentFormSchema,
  appointmentRescheduleFormSchema,
  type AppointmentFormValues,
  type AppointmentRescheduleFormValues,
} from '../forms/appointment.schema'
import { useAppointmentMutations } from '../hooks/use-appointments'
import type { Appointment } from '../types/appointments.types'
import {
  appointmentVehicleLabel,
  formatAppointmentSchedule,
  getAppointmentErrorMessage,
  todayISO,
} from '../utils/appointment-formatters'

interface AppointmentFormModalProps {
  open: boolean
  mode: 'create' | 'reschedule'
  appointment: Appointment | null
  onClose: () => void
}

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

const emptyCreateValues: AppointmentFormValues = {
  customerId: '',
  vehicleId: '',
  date: '',
  time: '',
  reason: '',
}

const emptyRescheduleValues: AppointmentRescheduleFormValues = {
  date: '',
  time: '',
}

export function AppointmentFormModal({
  open,
  mode,
  appointment,
  onClose,
}: AppointmentFormModalProps) {
  const mutations = useAppointmentMutations()
  const isReschedule = mode === 'reschedule'
  const customers = useCustomers({
    search: '',
    type: 'all',
    page: 1,
    pageSize: 100,
  })

  const createForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: emptyCreateValues,
  })
  const rescheduleForm = useForm<AppointmentRescheduleFormValues>({
    resolver: zodResolver(appointmentRescheduleFormSchema),
    defaultValues: emptyRescheduleValues,
  })
  const { reset: resetCreate } = createForm
  const { reset: resetReschedule } = rescheduleForm

  const customerId = useWatch({
    control: createForm.control,
    name: 'customerId',
  })
  const vehicleId = useWatch({
    control: createForm.control,
    name: 'vehicleId',
  })
  const createDate = useWatch({ control: createForm.control, name: 'date' })
  const createTime = useWatch({ control: createForm.control, name: 'time' })
  const rescheduleDate = useWatch({
    control: rescheduleForm.control,
    name: 'date',
  })
  const rescheduleTime = useWatch({
    control: rescheduleForm.control,
    name: 'time',
  })
  const vehicles = useQuery({
    queryKey: vehicleKeys.list({
      search: '',
      customerId,
      page: 1,
      pageSize: 100,
    }),
    queryFn: ({ signal }) =>
      vehiclesService.list(
        { search: '', customerId, page: 1, pageSize: 100 },
        signal,
      ),
    enabled: Boolean(customerId),
  })

  const customerOptions = useMemo<SmartSelectOption[]>(
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

  const vehicleOptions = useMemo<SmartSelectOption[]>(
    () =>
      (vehicles.data?.data ?? []).map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.plate} · ${vehicle.brand} ${vehicle.model}`,
        meta: String(vehicle.year),
        searchTerms: [
          vehicle.plate,
          vehicle.brand,
          vehicle.model,
          String(vehicle.year),
        ],
      })),
    [vehicles.data],
  )

  useEffect(() => {
    if (!open) return
    resetCreate(
      appointment
        ? {
            customerId: appointment.customer?.id ?? '',
            vehicleId: appointment.vehicle.id,
            date: appointment.date,
            time: appointment.time,
            reason: appointment.reason,
          }
        : emptyCreateValues,
    )
    resetReschedule(
      appointment
        ? { date: appointment.date, time: appointment.time }
        : emptyRescheduleValues,
    )
  }, [open, appointment, resetCreate, resetReschedule])

  const busy = isReschedule
    ? mutations.reschedule.isPending
    : mutations.create.isPending

  const createError = (name: keyof AppointmentFormValues) => {
    const message = createForm.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  const rescheduleError = (name: keyof AppointmentRescheduleFormValues) => {
    const message = rescheduleForm.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  const firstCreateError = () => {
    const fields = [
      'customerId',
      'vehicleId',
      'date',
      'time',
      'reason',
    ] as const
    for (const field of fields) {
      const message = createForm.getFieldState(field).error?.message
      if (message) return String(message)
    }
    return ''
  }

  const firstRescheduleError = () => {
    const fields = ['date', 'time'] as const
    for (const field of fields) {
      const message = rescheduleForm.getFieldState(field).error?.message
      if (message) return String(message)
    }
    return ''
  }

  const submitCreate = async () => {
    const valid = await createForm.trigger()
    if (!valid) {
      const message = firstCreateError() || 'Revisa los campos del formulario.'
      toast.error(message)
      return
    }
    const values = createForm.getValues()
    try {
      await mutations.create.mutateAsync({
        customerId: values.customerId,
        vehicleId: values.vehicleId,
        date: values.date,
        time: values.time,
        reason: values.reason,
      })
      toast.success('Cita registrada correctamente.')
      onClose()
    } catch (error) {
      toast.error(getAppointmentErrorMessage(error))
    }
  }

  const submitReschedule = async () => {
    if (!appointment) return
    const valid = await rescheduleForm.trigger()
    if (!valid) {
      const message =
        firstRescheduleError() || 'Revisa los campos del formulario.'
      toast.error(message)
      return
    }
    const values = rescheduleForm.getValues()
    try {
      await mutations.reschedule.mutateAsync({
        id: appointment.id,
        input: { date: values.date, time: values.time },
      })
      toast.success('Cita reprogramada correctamente.')
      onClose()
    } catch (error) {
      toast.error(getAppointmentErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReschedule ? 'Reprogramar cita' : 'Nueva cita'}
      description={
        isReschedule
          ? appointment
            ? `Cambia la fecha y hora de la cita ${appointment.code}.`
            : 'Cambia la fecha y hora de la cita.'
          : 'Registra una cita de atención para un vehículo del cliente.'
      }
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void (isReschedule ? submitReschedule() : submitCreate())
            }
          >
            {busy
              ? isReschedule
                ? 'Guardando…'
                : 'Registrando…'
              : isReschedule
                ? 'Guardar cambios'
                : 'Registrar cita'}
          </Button>
        </div>
      }
    >
      {isReschedule ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
            <CalendarClock
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <div className="text-sm">
              <p className="font-semibold">
                {appointment?.code ?? 'Cita'}
                {appointment && ` · ${appointmentVehicleLabel(appointment)}`}
              </p>
              <p className="mt-1 text-muted-foreground">
                Actual:{' '}
                {appointment
                  ? formatAppointmentSchedule(
                      appointment.date,
                      appointment.time,
                    )
                  : '—'}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nueva fecha" error={rescheduleError('date')} required>
              <DatePicker
                value={rescheduleDate}
                aria-label="Nueva fecha de la cita"
                min={todayISO()}
                onChange={(date) => rescheduleForm.setValue('date', date)}
              />
            </Field>
            <Field label="Nueva hora" error={rescheduleError('time')} required>
              <TimePicker
                value={rescheduleTime}
                aria-label="Nueva hora de la cita"
                interval={30}
                onChange={(time) => rescheduleForm.setValue('time', time)}
              />
            </Field>
          </div>
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Info aria-hidden size={14} className="mt-0.5 shrink-0" />
            Hasta 8 citas activas por fecha y hora; si el horario está completo,
            el sistema rechazará el cambio.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <Field label="Cliente" error={createError('customerId')} required>
            <SmartSelect
              value={customerId}
              aria-label="Cliente de la cita"
              placeholder="Seleccionar cliente"
              searchPlaceholder="Buscar cliente o documento…"
              emptyMessage="Sin clientes registrados."
              options={customerOptions}
              disabled={busy}
              onChange={(value) => {
                createForm.setValue('customerId', value)
                createForm.setValue('vehicleId', '')
              }}
            />
          </Field>
          <Field
            label="Vehículo"
            error={createError('vehicleId')}
            hint={customerId ? undefined : 'Selecciona primero el cliente.'}
            required
          >
            <SmartSelect
              value={vehicleId}
              aria-label="Vehículo de la cita"
              placeholder="Seleccionar vehículo"
              searchPlaceholder="Buscar placa o modelo…"
              emptyMessage={
                customerId
                  ? 'El cliente no tiene vehículos registrados.'
                  : 'Selecciona primero el cliente.'
              }
              options={vehicleOptions}
              disabled={!customerId || busy}
              onChange={(value) => createForm.setValue('vehicleId', value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha" error={createError('date')} required>
              <DatePicker
                value={createDate}
                aria-label="Fecha de la cita"
                min={todayISO()}
                onChange={(date) => createForm.setValue('date', date)}
              />
            </Field>
            <Field label="Hora" error={createError('time')} required>
              <TimePicker
                value={createTime}
                aria-label="Hora de la cita"
                interval={30}
                onChange={(time) => createForm.setValue('time', time)}
              />
            </Field>
          </div>
          <Field
            label="Motivo"
            error={createError('reason')}
            hint="Máximo 300 caracteres"
            required
          >
            <textarea
              {...createForm.register('reason')}
              aria-label="Motivo de la cita"
              rows={3}
              placeholder="Motivo de la atención, por ejemplo: cambio de aceite"
              className={`${inputClass} h-auto resize-y py-3`}
            />
          </Field>
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Info aria-hidden size={14} className="mt-0.5 shrink-0" />
            Hasta 8 citas activas por fecha y hora; si el horario está completo,
            el sistema rechazará la cita.
          </p>
        </div>
      )}
    </Modal>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>
        {label}
        {required && <span className="ml-1 text-emerald-700">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-normal text-red-600">{error}</span>
      ) : hint ? (
        <span className="block text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
