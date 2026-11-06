import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Gauge, Fuel } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { customerDisplayName } from '@/features/customers/utils/customer-formatters'
import { vehicleKeys } from '@/features/vehicles/hooks/use-vehicles'
import { vehiclesService } from '@/features/vehicles/services/vehicles.service'
import {
  directWorkOrderFormSchema,
  fuelLevelOptions,
  type DirectWorkOrderFormValues,
} from '../forms/direct-work-order.schema'
import {
  useWorkOrdersMutations,
  useYardCapacity,
} from '../hooks/use-work-orders'
import { getWorkOrderErrorMessage } from '../utils/work-order-formatters'

interface DirectWorkOrderModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (workOrderId: string) => void
}

const defaultValues: DirectWorkOrderFormValues = {
  customerId: '',
  vehicleId: '',
  currentMileage: null,
  fuelLevel: null,
  receptionNotes: '',
}

export function DirectWorkOrderModal({
  open,
  onClose,
  onSuccess,
}: DirectWorkOrderModalProps) {
  const mutations = useWorkOrdersMutations()
  const { data: yardCapacity } = useYardCapacity()

  const customersQuery = useCustomers({
    search: '',
    type: 'all',
    page: 1,
    pageSize: 100,
  })

  const form = useForm<DirectWorkOrderFormValues>({
    resolver: zodResolver(directWorkOrderFormSchema),
    defaultValues,
  })

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = form

  const customerId = useWatch({ control, name: 'customerId' })

  const vehiclesQuery = useQuery({
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
    enabled: Boolean(customerId) && open,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  // Reset vehicle when customer changes
  useEffect(() => {
    setValue('vehicleId', '')
  }, [customerId, setValue])

  const customerOptions = useMemo<SmartSelectOption[]>(
    () =>
      (customersQuery.data?.data ?? []).map((customer) => ({
        value: customer.id,
        label: `${customerDisplayName(customer)} · ${customer.documentNumber}`,
        searchTerms: [
          customer.documentNumber,
          customer.phone,
          customerDisplayName(customer),
        ],
      })),
    [customersQuery.data],
  )

  const vehicleOptions = useMemo<SmartSelectOption[]>(
    () =>
      (vehiclesQuery.data?.data ?? []).map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.plate} · ${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
        searchTerms: [vehicle.plate, vehicle.brand, vehicle.model],
      })),
    [vehiclesQuery.data],
  )

  const onSubmit = async (values: DirectWorkOrderFormValues) => {
    try {
      const response = await mutations.createDirect.mutateAsync({
        customerId: values.customerId,
        vehicleId: values.vehicleId,
        currentMileage: values.currentMileage ?? null,
        fuelLevel: values.fuelLevel ?? null,
        receptionNotes: values.receptionNotes?.trim() || null,
      })

      toast.success(
        `Orden directa ${response.data.code} registrada exitosamente.`,
      )
      onClose()
      if (onSuccess) {
        onSuccess(response.data.id)
      }
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
  }

  const isBusy = mutations.createDirect.isPending
  const isFull = yardCapacity?.isAtCapacity ?? false

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva orden directa en taller"
      description="Registra el ingreso de un vehículo en frío (walk-in) sin cita previa."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {isFull && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-rose-600"
            />
            <div>
              <p className="font-semibold">
                Capacidad de patio al 100% (8/8 bahías ocupadas)
              </p>
              <p className="mt-0.5 text-rose-700">
                El taller se encuentra a su aforo máximo. Asegúrate de contar
                con espacio físico o liberar un vehículo antes de ingresar este
                auto.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="directCustomerId" className="text-sm font-medium">
            Cliente <span className="text-destructive">*</span>
          </label>
          <SmartSelect
            id="directCustomerId"
            placeholder="Selecciona o busca un cliente…"
            options={customerOptions}
            value={customerId}
            onChange={(val) =>
              setValue('customerId', val, { shouldValidate: true })
            }
            aria-invalid={Boolean(errors.customerId)}
          />
          {errors.customerId && (
            <p className="text-xs text-destructive" role="alert">
              {errors.customerId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="directVehicleId" className="text-sm font-medium">
            Vehículo <span className="text-destructive">*</span>
          </label>
          <SmartSelect
            id="directVehicleId"
            placeholder={
              customerId
                ? vehiclesQuery.isLoading
                  ? 'Cargando vehículos…'
                  : vehicleOptions.length > 0
                    ? 'Selecciona la placa del vehículo…'
                    : 'Este cliente no tiene vehículos registrados.'
                : 'Primero selecciona un cliente'
            }
            options={vehicleOptions}
            value={form.watch('vehicleId')}
            onChange={(val) => {
              setValue('vehicleId', val, { shouldValidate: true })
              const veh = vehiclesQuery.data?.data?.find((v) => v.id === val)
              if (veh && (veh as any).mileage) {
                setValue('currentMileage', (veh as any).mileage)
              }
            }}
            disabled={!customerId || vehiclesQuery.isLoading}
            aria-invalid={Boolean(errors.vehicleId)}
          />
          {errors.vehicleId && (
            <p className="text-xs text-destructive" role="alert">
              {errors.vehicleId.message}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="directCurrentMileage"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Gauge size={14} className="text-muted-foreground" />
              Kilometraje actual (km)
            </label>
            <Input
              id="directCurrentMileage"
              type="number"
              min={0}
              placeholder="Ej. 45000"
              {...register('currentMileage', {
                setValueAs: (v) =>
                  v === '' ||
                  v === null ||
                  v === undefined ||
                  Number.isNaN(Number(v))
                    ? null
                    : Number(v),
              })}
              aria-invalid={Boolean(errors.currentMileage)}
            />
            {errors.currentMileage && (
              <p className="text-xs text-destructive" role="alert">
                {errors.currentMileage.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="directFuelLevel"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Fuel size={14} className="text-muted-foreground" />
              Nivel de combustible
            </label>
            <SmartSelect
              id="directFuelLevel"
              placeholder="Nivel de tanque…"
              options={fuelLevelOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={form.watch('fuelLevel') ?? ''}
              onChange={(val) =>
                setValue(
                  'fuelLevel',
                  (val || null) as DirectWorkOrderFormValues['fuelLevel'],
                  { shouldValidate: true },
                )
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="directReceptionNotes" className="text-sm font-medium">
            Motivo de ingreso u observaciones de recepción
          </label>
          <textarea
            id="directReceptionNotes"
            rows={3}
            placeholder="Describe la manifestación del cliente o síntomas del vehículo…"
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none no-scrollbar focus:ring-2 focus:ring-ring"
            {...register('receptionNotes')}
          />
          {errors.receptionNotes && (
            <p className="text-xs text-destructive" role="alert">
              {errors.receptionNotes.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isBusy} aria-busy={isBusy}>
            {isBusy ? 'Registrando ingreso…' : 'Crear orden directa'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
