import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { emptyVehicleForm, vehicleFormSchema } from '../forms/vehicles.schema'
import type { VehicleFormValues } from '../forms/vehicles.schema'
import { useVehicleMutations } from '../hooks/use-vehicles'
import { useVehicleOwnerOptions } from '../hooks/use-vehicle-owner-options'
import type { Vehicle } from '../types/vehicles.types'
import {
  formatPlateInput,
  getVehiclesErrorMessage,
  mapVehicleFormValues,
  mapVehicleToFormValues,
  vehicleOwnerDisplay,
} from '../utils/vehicle-formatters'

interface VehicleFormModalProps {
  open: boolean
  vehicle: Vehicle | null
  onClose: () => void
}

export function VehicleFormModal({
  open,
  vehicle,
  onClose,
}: VehicleFormModalProps) {
  const mutations = useVehicleMutations()
  const owners = useVehicleOwnerOptions()
  const isEditing = vehicle !== null
  const isSubmitting = mutations.create.isPending || mutations.update.isPending
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: emptyVehicleForm,
  })
  const { reset } = form
  const plateValue = useWatch({ control: form.control, name: 'plate' })
  const customerIdValue = useWatch({
    control: form.control,
    name: 'customerId',
  })

  const currentOwnerOption = useMemo(() => {
    if (!vehicle) return undefined
    return {
      value: vehicle.customerId,
      label: `${vehicleOwnerDisplay(vehicle.owner)} · ${vehicle.owner.documentNumber}`,
      searchTerms: [
        vehicle.owner.documentNumber,
        vehicleOwnerDisplay(vehicle.owner),
      ],
    }
  }, [vehicle])

  const ownerOptions = useMemo(() => {
    const base = currentOwnerOption
      ? [currentOwnerOption, ...owners.options]
      : owners.options
    return base.filter(
      (option, index, all) =>
        all.findIndex((candidate) => candidate.value === option.value) ===
        index,
    )
  }, [owners.options, currentOwnerOption])

  useEffect(() => {
    if (!open) return
    reset(vehicle ? mapVehicleToFormValues(vehicle) : emptyVehicleForm)
  }, [open, reset, vehicle])

  const submit = form.handleSubmit(async (values) => {
    try {
      const input = mapVehicleFormValues(values)
      if (isEditing && vehicle) {
        await mutations.update.mutateAsync({
          id: vehicle.id,
          input: {
            plate: input.plate,
            brand: input.brand,
            model: input.model,
            year: input.year,
          },
        })
      } else {
        await mutations.create.mutateAsync(input)
      }
      toast.success(
        isEditing
          ? 'Vehículo actualizado correctamente.'
          : 'Vehículo registrado correctamente.',
      )
      onClose()
    } catch (error) {
      toast.error(getVehiclesErrorMessage(error))
    }
  })

  const error = (name: keyof VehicleFormValues) => {
    const message = form.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  const ownerHint = owners.isError
    ? 'No se pudo cargar los clientes.'
    : isEditing
      ? 'El propietario no se puede cambiar al editar.'
      : undefined
  const ownerError = error('customerId')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar vehículo' : 'Registrar vehículo'}
      description={
        isEditing
          ? 'Actualiza placa, marca, modelo o año. El propietario permanece sin cambios.'
          : 'Registra una unidad vinculada a un cliente existente del catálogo.'
      }
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="vehicle-form" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar cambios'
                : 'Registrar vehículo'}
          </Button>
        </div>
      }
    >
      <form
        id="vehicle-form"
        onSubmit={submit}
        noValidate
        className="space-y-5"
      >
        <Field
          label="Placa"
          error={error('plate')}
          hint="Se guarda sin espacios ni guiones"
          required
        >
          <Input
            value={plateValue}
            onChange={(event) =>
              form.setValue('plate', formatPlateInput(event.target.value), {
                shouldValidate: true,
              })
            }
            maxLength={12}
            placeholder="Ej. ABC-123"
            className="font-mono font-semibold tracking-wide uppercase"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marca" error={error('brand')} required>
            <Input {...form.register('brand')} placeholder="Ej. Toyota" />
          </Field>
          <Field label="Modelo" error={error('model')} required>
            <Input {...form.register('model')} placeholder="Ej. Corolla" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Año"
            error={error('year')}
            hint={`Entre 1950 y ${new Date().getFullYear() + 1}`}
            required
          >
            <Input
              {...form.register('year')}
              inputMode="numeric"
              maxLength={4}
              placeholder="Ej. 2021"
            />
          </Field>
          <Field
            label="Propietario"
            error={ownerError}
            hint={ownerHint}
            required
          >
            <SmartSelect
              value={customerIdValue}
              aria-label="Propietario del vehículo"
              placeholder={
                owners.isPending
                  ? 'Cargando clientes…'
                  : 'Seleccionar propietario'
              }
              emptyMessage="Sin clientes disponibles."
              disabled={isEditing}
              options={ownerOptions}
              onChange={(customerId) =>
                form.setValue('customerId', customerId, {
                  shouldValidate: true,
                })
              }
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          La placa identifica la unidad de forma única en todo el sistema.{' '}
          {isEditing
            ? 'Para transferir el vehículo a otro cliente se usará una operación dedicada.'
            : 'El propietario queda marcado en la ficha y es navegable.'}
        </p>
      </form>
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
