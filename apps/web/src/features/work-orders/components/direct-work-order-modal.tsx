import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Car, Gauge, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { customersService } from '@/features/customers/services/customers.service'
import type { CustomerCreateInput } from '@/features/customers/types/customers.types'
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
  isNewCustomer: false,
  customerId: '',
  vehicleId: '',
  customerType: 'NATURAL',
  documentNumber: '',
  firstName: '',
  lastName: '',
  legalName: '',
  phone: '',
  email: '',
  vehiclePlate: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: new Date().getFullYear(),
  currentMileage: null,
  receptionNotes: '',
  receptionFuelLevel: '',
}

export function DirectWorkOrderModal({
  open,
  onClose,
  onSuccess,
}: DirectWorkOrderModalProps) {
  const queryClient = useQueryClient()
  const mutations = useWorkOrdersMutations()
  const { data: yardCapacity } = useYardCapacity()
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

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

  const isNewCustomer = useWatch({ control, name: 'isNewCustomer' })
  const customerType = useWatch({ control, name: 'customerType' })
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
    enabled: Boolean(customerId) && !isNewCustomer && open,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  // Reset vehicle when customer changes
  useEffect(() => {
    if (!isNewCustomer) {
      setValue('vehicleId', '')
    }
  }, [customerId, isNewCustomer, setValue])

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
      let finalCustomerId = values.customerId
      let finalVehicleId = values.vehicleId

      if (values.isNewCustomer) {
        setIsCreatingCustomer(true)
        const vehicleData = {
          plate: values.vehiclePlate.toUpperCase().trim(),
          brand: values.vehicleBrand.trim(),
          model: values.vehicleModel.trim(),
          year: Number(values.vehicleYear),
          mileage: values.currentMileage ?? null,
        }

        const customerPayload: CustomerCreateInput =
          values.customerType === 'NATURAL'
            ? {
                type: 'NATURAL',
                documentNumber: values.documentNumber.trim(),
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                phone: values.phone.trim(),
                email: values.email.trim() || null,
                vehicle: vehicleData,
              }
            : {
                type: 'LEGAL',
                documentNumber: values.documentNumber.trim(),
                legalName: values.legalName.trim(),
                phone: values.phone.trim(),
                email: values.email.trim() || null,
                vehicle: vehicleData,
              }

        const customerResponse = await customersService.create(customerPayload)

        finalCustomerId = customerResponse.data.id
        finalVehicleId = customerResponse.data.createdVehicle?.id || ''

        if (!finalVehicleId) {
          throw new Error(
            'No se pudo asociar el vehículo registrado a la orden.',
          )
        }

        void queryClient.invalidateQueries({ queryKey: ['customers'] })
        void queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      }

      const response = await mutations.createDirect.mutateAsync({
        customerId: finalCustomerId,
        vehicleId: finalVehicleId,
        currentMileage: values.currentMileage ?? null,
        fuelLevel: values.receptionFuelLevel
          ? {
              E: 'EMPTY',
              '1/4': 'QUARTER',
              '1/2': 'HALF',
              '3/4': 'THREE_QUARTERS',
              F: 'FULL',
            }[values.receptionFuelLevel]
          : null,
        receptionNotes: values.receptionNotes?.trim() || null,
      })

      toast.success(
        values.isNewCustomer
          ? `Cliente, vehículo y orden directa ${response.data.code} registrados exitosamente.`
          : `Orden directa ${response.data.code} registrada exitosamente.`,
      )
      onClose()
      if (onSuccess) {
        onSuccess(response.data.id)
      }
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const isBusy = mutations.createDirect.isPending || isCreatingCustomer
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

        {/* Selector de modo: Cliente existente vs Cliente nuevo */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <UserPlus className="size-4 text-primary shrink-0" />
            <div>
              <label
                htmlFor="isNewCustomerToggle"
                className="text-sm font-semibold text-foreground cursor-pointer"
              >
                ¿Es un cliente nuevo?
              </label>
              <p className="text-xs text-muted-foreground">
                Regístralo en el acto junto con su vehículo
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              id="isNewCustomerToggle"
              type="checkbox"
              className="sr-only peer"
              checked={isNewCustomer}
              onChange={(e) => {
                setValue('isNewCustomer', e.target.checked, {
                  shouldValidate: true,
                })
              }}
            />
            <div className="peer h-6 w-11 rounded-full bg-input peer-checked:bg-brand-forest transition-colors after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Sección de Cliente y Vehículo */}
        {isNewCustomer ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                1. Datos del Nuevo Cliente
              </span>

              {/* Tipo de cliente */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    value="NATURAL"
                    checked={customerType === 'NATURAL'}
                    onChange={() =>
                      setValue('customerType', 'NATURAL', {
                        shouldValidate: true,
                      })
                    }
                    className="accent-brand-forest"
                  />
                  Persona Natural
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    value="LEGAL"
                    checked={customerType === 'LEGAL'}
                    onChange={() =>
                      setValue('customerType', 'LEGAL', {
                        shouldValidate: true,
                      })
                    }
                    className="accent-brand-forest"
                  />
                  Empresa / Jurídica
                </label>
              </div>

              {/* Documento y Nombres */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="newDocNumber" className="text-xs font-medium">
                    {customerType === 'NATURAL'
                      ? 'DNI (8 dígitos)'
                      : 'RUC (11 dígitos)'}{' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newDocNumber"
                    maxLength={customerType === 'NATURAL' ? 8 : 11}
                    placeholder={
                      customerType === 'NATURAL' ? '12345678' : '20123456789'
                    }
                    {...register('documentNumber')}
                    aria-invalid={Boolean(errors.documentNumber)}
                  />
                  {errors.documentNumber && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.documentNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="newPhone" className="text-xs font-medium">
                    Teléfono celular <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newPhone"
                    placeholder="987654321"
                    {...register('phone')}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {customerType === 'NATURAL' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="newFirstName"
                      className="text-xs font-medium"
                    >
                      Nombres <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="newFirstName"
                      placeholder="Juan Carlos"
                      {...register('firstName')}
                      aria-invalid={Boolean(errors.firstName)}
                    />
                    {errors.firstName && (
                      <p className="text-[11px] font-medium text-destructive">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="newLastName"
                      className="text-xs font-medium"
                    >
                      Apellidos <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="newLastName"
                      placeholder="Pérez García"
                      {...register('lastName')}
                      aria-invalid={Boolean(errors.lastName)}
                    />
                    {errors.lastName && (
                      <p className="text-[11px] font-medium text-destructive">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label htmlFor="newLegalName" className="text-xs font-medium">
                    Razón Social <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newLegalName"
                    placeholder="Transportes y Servicios S.A.C."
                    {...register('legalName')}
                    aria-invalid={Boolean(errors.legalName)}
                  />
                  {errors.legalName && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.legalName.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="newEmail" className="text-xs font-medium">
                  Correo electrónico (opcional)
                </label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && (
                  <p className="text-[11px] font-medium text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Datos del vehículo del nuevo cliente */}
            <div className="space-y-2 border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Car className="size-3.5" />
                2. Vehículo a Ingresar
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="newVehiclePlate"
                    className="text-xs font-medium"
                  >
                    Placa <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newVehiclePlate"
                    placeholder="ABC-123"
                    className="font-mono uppercase"
                    maxLength={10}
                    {...register('vehiclePlate')}
                    onChange={(e) => {
                      setValue('vehiclePlate', e.target.value.toUpperCase(), {
                        shouldValidate: true,
                      })
                    }}
                    aria-invalid={Boolean(errors.vehiclePlate)}
                  />
                  {errors.vehiclePlate && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.vehiclePlate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="newVehicleBrand"
                    className="text-xs font-medium"
                  >
                    Marca <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newVehicleBrand"
                    placeholder="Ej. Toyota"
                    {...register('vehicleBrand')}
                    aria-invalid={Boolean(errors.vehicleBrand)}
                  />
                  {errors.vehicleBrand && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.vehicleBrand.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="newVehicleModel"
                    className="text-xs font-medium"
                  >
                    Modelo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newVehicleModel"
                    placeholder="Ej. Yaris"
                    {...register('vehicleModel')}
                    aria-invalid={Boolean(errors.vehicleModel)}
                  />
                  {errors.vehicleModel && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.vehicleModel.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="newVehicleYear"
                    className="text-xs font-medium"
                  >
                    Año <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="newVehicleYear"
                    type="number"
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    placeholder="2022"
                    {...register('vehicleYear', {
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                    aria-invalid={Boolean(errors.vehicleYear)}
                  />
                  {errors.vehicleYear && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.vehicleYear.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                  className="text-xs font-medium text-destructive"
                  role="alert"
                >
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
                value={vehicleId}
                onChange={(val) => {
                  setValue('vehicleId', val, { shouldValidate: true })
                }}
                disabled={!customerId || vehiclesQuery.isLoading}
                aria-invalid={Boolean(errors.vehicleId)}
              />
              {errors.vehicleId && (
                <p
                  className="text-xs font-medium text-destructive"
                  role="alert"
                >
                  {errors.vehicleId.message}
                </p>
              )}
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="directCurrentMileage"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Gauge size={14} className="text-muted-foreground" />
              Kilometraje actual (opcional)
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
              <p className="text-xs font-medium text-destructive" role="alert">
                {errors.currentMileage.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="directReceptionFuelLevel"
              className="text-sm font-medium"
            >
              Combustible al recibir (opcional)
            </label>
            <SmartSelect
              id="directReceptionFuelLevel"
              placeholder="No registrar combustible"
              options={receptionFuelLevelOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={receptionFuelLevel}
              onChange={(value) =>
                setValue(
                  'receptionFuelLevel',
                  value as DirectWorkOrderFormValues['receptionFuelLevel'],
                  { shouldValidate: true },
                )
              }
            />
          </div>
        </div>

        {/* Motivo de ingreso */}
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
            <p className="text-xs font-medium text-destructive" role="alert">
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
