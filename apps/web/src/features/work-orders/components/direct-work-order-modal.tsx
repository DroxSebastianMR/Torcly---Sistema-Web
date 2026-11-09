import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Gauge } from 'lucide-react'
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
  receptionFuelLevelOptions,
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
  receptionNotes: '',
  receptionFuelLevel: '1/2',
  hasSpareTire: false,
  hasJackAndTools: false,
  hasVehicleDocuments: false,
  hasRadioFaceplate: false,
  externalDamageNotes: '',
  photoUrls: '',
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
  const vehicleId = useWatch({ control, name: 'vehicleId' })
  const receptionFuelLevel = useWatch({
    control,
    name: 'receptionFuelLevel',
  })

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
        fuelLevel: {
          E: 'EMPTY',
          '1/4': 'QUARTER',
          '1/2': 'HALF',
          '3/4': 'THREE_QUARTERS',
          F: 'FULL',
        }[values.receptionFuelLevel],
        receptionNotes: values.receptionNotes?.trim() || null,
        receptionChecklist: {
          fuelLevel: values.receptionFuelLevel,
          hasSpareTire: values.hasSpareTire,
          hasJackAndTools: values.hasJackAndTools,
          hasVehicleDocuments: values.hasVehicleDocuments,
          hasRadioFaceplate: values.hasRadioFaceplate,
          externalDamageNotes: values.externalDamageNotes?.trim() || null,
          photos: (values.photoUrls ?? '')
            .split(/\r?\n|,/)
            .map((url) => url.trim())
            .filter(Boolean),
        },
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
            <p
              className="text-xs font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.customerId.message}
            </p>
          )}
        </div>

        <fieldset className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
          <legend className="px-1 text-sm font-semibold">Checklist de recepción</legend>
          <div className="space-y-1.5">
            <label htmlFor="directReceptionFuelLevel" className="text-sm font-medium">
              Combustible al recibir
            </label>
            <SmartSelect
              id="directReceptionFuelLevel"
              placeholder="Selecciona el nivel…"
              options={receptionFuelLevelOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={receptionFuelLevel}
              onChange={(value) =>
                setValue('receptionFuelLevel', value as DirectWorkOrderFormValues['receptionFuelLevel'], {
                  shouldValidate: true,
                })
              }
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
              ['hasSpareTire', 'Llanta de repuesto'],
              ['hasJackAndTools', 'Gata y herramientas'],
              ['hasVehicleDocuments', 'Documentos del vehículo'],
              ['hasRadioFaceplate', 'Panel de radio'],
              ] as const
            ).map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                <input type="checkbox" className="size-4 accent-brand-forest" {...register(name)} />
                {label}: <span className="font-medium">Sí</span>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="externalDamageNotes" className="text-sm font-medium">Daños externos observados</label>
            <textarea id="externalDamageNotes" rows={2} placeholder="Describe rayones, golpes u observaciones visibles…" className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none no-scrollbar focus:ring-2 focus:ring-ring" {...register('externalDamageNotes')} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="photoUrls" className="text-sm font-medium">Fotos (URLs, una por línea)</label>
            <textarea id="photoUrls" rows={2} placeholder="https://…" className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none no-scrollbar focus:ring-2 focus:ring-ring" {...register('photoUrls')} />
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="directVehicleId" className="text-sm font-medium">
            Vehículo <span className="text-red-600 dark:text-red-400">*</span>
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
            value={vehicleId}
            onChange={(val) => {
              setValue('vehicleId', val, { shouldValidate: true })
            }}
            disabled={!customerId || vehiclesQuery.isLoading}
            aria-invalid={Boolean(errors.vehicleId)}
          />
          {errors.vehicleId && (
            <p
              className="text-xs font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.vehicleId.message}
            </p>
          )}
        </div>

        <div className="grid gap-3">
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
              <p
                className="text-xs font-medium text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.currentMileage.message}
              </p>
            )}
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
            <p
              className="text-xs font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
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
