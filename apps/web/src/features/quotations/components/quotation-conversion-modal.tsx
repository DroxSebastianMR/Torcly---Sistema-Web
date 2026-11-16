import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { NewCustomerModeToggle } from '@/features/customers/components/new-customer-mode-toggle'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import type { CustomerType } from '@/features/customers/types/customers.types'
import { customerDisplayName } from '@/features/customers/utils/customer-formatters'
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles'
import type {
  QuotationConversionInput,
  QuotationSummary,
} from '../types/quotations.types'

interface QuotationConversionModalProps {
  open: boolean
  quotation: QuotationSummary | null
  loading?: boolean
  onClose: () => void
  onSubmit: (input: QuotationConversionInput) => Promise<void>
}

const emptyCustomer = {
  documentNumber: '',
  firstName: '',
  lastName: '',
  legalName: '',
  phone: '',
  email: '',
  plate: '',
  brand: '',
  model: '',
  year: String(new Date().getFullYear()),
}

export function QuotationConversionModal({
  open,
  quotation,
  loading = false,
  onClose,
  onSubmit,
}: QuotationConversionModalProps) {
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [customerId, setCustomerId] = useState(
    () => quotation?.customer?.id ?? '',
  )
  const [vehicleId, setVehicleId] = useState(() => quotation?.vehicle?.id ?? '')
  const [customerType, setCustomerType] = useState<CustomerType>('NATURAL')
  const [newCustomer, setNewCustomer] = useState(() => ({
    ...emptyCustomer,
    plate: quotation?.vehiclePlate ?? '',
  }))
  const [error, setError] = useState<string | null>(null)

  const customers = useCustomers(
    { search: '', type: 'all', page: 1, pageSize: 100 },
    open && !isNewCustomer,
  )
  const vehicles = useVehicles(
    { search: '', customerId, page: 1, pageSize: 100 },
    open && !isNewCustomer && Boolean(customerId),
  )

  const customerOptions = useMemo<SmartSelectOption[]>(
    () =>
      (customers.data?.data ?? []).map((customer) => ({
        value: customer.id,
        label: `${customerDisplayName(customer)} · ${customer.documentNumber}`,
        meta: customer.phone,
        searchTerms: [
          customerDisplayName(customer),
          customer.documentNumber,
          customer.phone,
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
        searchTerms: [vehicle.plate, vehicle.brand, vehicle.model],
      })),
    [vehicles.data],
  )

  const updateNewCustomer = (field: keyof typeof newCustomer, value: string) =>
    setNewCustomer((current) => ({ ...current, [field]: value }))

  const submit = async () => {
    setError(null)
    if (!isNewCustomer) {
      if (!customerId || !vehicleId) {
        setError('Selecciona un cliente y uno de sus vehículos.')
        return
      }
      await onSubmit({ mode: 'EXISTING', customerId, vehicleId })
      return
    }

    const vehicle = {
      plate: newCustomer.plate.trim().toUpperCase(),
      brand: newCustomer.brand.trim(),
      model: newCustomer.model.trim(),
      year: Number(newCustomer.year),
    }
    const common = {
      documentNumber: newCustomer.documentNumber.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email.trim() || null,
      vehicle,
    }
    const hasVehicle =
      vehicle.plate && vehicle.brand && vehicle.model && vehicle.year
    const validCustomer =
      customerType === 'NATURAL'
        ? common.documentNumber.length === 8 &&
          newCustomer.firstName.trim() &&
          newCustomer.lastName.trim()
        : common.documentNumber.length === 11 && newCustomer.legalName.trim()
    if (!validCustomer || !common.phone || !hasVehicle) {
      setError('Completa los datos obligatorios del cliente y vehículo.')
      return
    }
    await onSubmit({
      mode: 'NEW',
      customer:
        customerType === 'NATURAL'
          ? {
              ...common,
              type: 'NATURAL',
              firstName: newCustomer.firstName.trim(),
              lastName: newCustomer.lastName.trim(),
            }
          : {
              ...common,
              type: 'LEGAL',
              legalName: newCustomer.legalName.trim(),
            },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Completar datos para convertir"
      description="La orden de taller requiere un cliente y un vehículo identificados."
      className="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
          >
            {loading ? 'Convirtiendo…' : 'Convertir a orden'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <NewCustomerModeToggle
          id="quotation-conversion-isNewCustomerToggle"
          checked={isNewCustomer}
          description="Regístralo en el acto junto con su vehículo"
          onCheckedChange={(checked) => {
            setIsNewCustomer(checked)
            setError(null)
          }}
        />

        {isNewCustomer ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                1. Datos del nuevo cliente
              </span>
              <div className="flex gap-4 text-sm font-medium">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    checked={customerType === 'NATURAL'}
                    onChange={() => setCustomerType('NATURAL')}
                    className="accent-brand-forest"
                  />{' '}
                  Persona Natural
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    checked={customerType === 'LEGAL'}
                    onChange={() => setCustomerType('LEGAL')}
                    className="accent-brand-forest"
                  />{' '}
                  Empresa / Jurídica
                </label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  {customerType === 'NATURAL'
                    ? 'DNI (8 dígitos)'
                    : 'RUC (11 dígitos)'}{' '}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={
                    customerType === 'NATURAL' ? '12345678' : '20123456789'
                  }
                  value={newCustomer.documentNumber}
                  onChange={(event) =>
                    updateNewCustomer(
                      'documentNumber',
                      event.target.value.replace(/\D/g, ''),
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Teléfono celular <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="987654321"
                  value={newCustomer.phone}
                  onChange={(event) =>
                    updateNewCustomer('phone', event.target.value)
                  }
                />
              </div>
              {customerType === 'NATURAL' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Nombres <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Juan Carlos"
                      value={newCustomer.firstName}
                      onChange={(event) =>
                        updateNewCustomer('firstName', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Apellidos <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Pérez García"
                      value={newCustomer.lastName}
                      onChange={(event) =>
                        updateNewCustomer('lastName', event.target.value)
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium">
                    Razón Social <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Transportes y Servicios S.A.C."
                    value={newCustomer.legalName}
                    onChange={(event) =>
                      updateNewCustomer('legalName', event.target.value)
                    }
                  />
                </div>
              )}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium">
                  Correo electrónico (opcional)
                </label>
                <Input
                  placeholder="cliente@ejemplo.com"
                  value={newCustomer.email}
                  onChange={(event) =>
                    updateNewCustomer('email', event.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                2. Vehículo a registrar
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Placa <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="ABC-123"
                    className="font-mono uppercase"
                    value={newCustomer.plate}
                    onChange={(event) =>
                      updateNewCustomer(
                        'plate',
                        event.target.value.toUpperCase(),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Marca <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej. Toyota"
                    value={newCustomer.brand}
                    onChange={(event) =>
                      updateNewCustomer('brand', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Modelo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej. Yaris"
                    value={newCustomer.model}
                    onChange={(event) =>
                      updateNewCustomer('model', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Año <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="2026"
                    value={newCustomer.year}
                    onChange={(event) =>
                      updateNewCustomer('year', event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cliente</label>
              <SmartSelect
                value={customerId}
                options={customerOptions}
                placeholder="Seleccionar cliente"
                searchPlaceholder="Buscar cliente"
                aria-label="Seleccionar cliente para convertir"
                onChange={(value) => {
                  setCustomerId(value)
                  setVehicleId('')
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vehículo</label>
              <SmartSelect
                value={vehicleId}
                options={vehicleOptions}
                disabled={!customerId}
                placeholder={
                  customerId
                    ? 'Seleccionar vehículo'
                    : 'Primero selecciona un cliente'
                }
                emptyMessage="No hay vehículos para este cliente."
                aria-label="Seleccionar vehículo para convertir"
                onChange={setVehicleId}
              />
            </div>
          </div>
        )}
        {error && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
