import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
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
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              ¿Es un cliente nuevo?
            </p>
            <p className="text-xs text-muted-foreground">
              Regístralo con su primer vehículo sin salir de la conversión.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isNewCustomer}
            aria-label="¿Es un cliente nuevo?"
            onClick={() => {
              setIsNewCustomer((current) => !current)
              setError(null)
            }}
            className={`relative h-6 w-11 rounded-full transition-colors ${isNewCustomer ? 'bg-primary' : 'bg-input'}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${isNewCustomer ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        {isNewCustomer ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
            <div className="flex gap-4 text-sm font-medium">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={customerType === 'NATURAL'}
                  onChange={() => setCustomerType('NATURAL')}
                />{' '}
                Persona natural
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={customerType === 'LEGAL'}
                  onChange={() => setCustomerType('LEGAL')}
                />{' '}
                Empresa / jurídica
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={
                  customerType === 'NATURAL'
                    ? 'DNI (8 dígitos) *'
                    : 'RUC (11 dígitos) *'
                }
                value={newCustomer.documentNumber}
                onChange={(event) =>
                  updateNewCustomer(
                    'documentNumber',
                    event.target.value.replace(/\D/g, ''),
                  )
                }
              />
              <Input
                placeholder="Teléfono *"
                value={newCustomer.phone}
                onChange={(event) =>
                  updateNewCustomer('phone', event.target.value)
                }
              />
              {customerType === 'NATURAL' ? (
                <>
                  <Input
                    placeholder="Nombres *"
                    value={newCustomer.firstName}
                    onChange={(event) =>
                      updateNewCustomer('firstName', event.target.value)
                    }
                  />
                  <Input
                    placeholder="Apellidos *"
                    value={newCustomer.lastName}
                    onChange={(event) =>
                      updateNewCustomer('lastName', event.target.value)
                    }
                  />
                </>
              ) : (
                <Input
                  className="sm:col-span-2"
                  placeholder="Razón social *"
                  value={newCustomer.legalName}
                  onChange={(event) =>
                    updateNewCustomer('legalName', event.target.value)
                  }
                />
              )}
              <Input
                className="sm:col-span-2"
                placeholder="Correo electrónico (opcional)"
                value={newCustomer.email}
                onChange={(event) =>
                  updateNewCustomer('email', event.target.value)
                }
              />
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                Vehículo a registrar
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Placa *"
                  value={newCustomer.plate}
                  onChange={(event) =>
                    updateNewCustomer('plate', event.target.value.toUpperCase())
                  }
                />
                <Input
                  placeholder="Marca *"
                  value={newCustomer.brand}
                  onChange={(event) =>
                    updateNewCustomer('brand', event.target.value)
                  }
                />
                <Input
                  placeholder="Modelo *"
                  value={newCustomer.model}
                  onChange={(event) =>
                    updateNewCustomer('model', event.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Año *"
                  value={newCustomer.year}
                  onChange={(event) =>
                    updateNewCustomer('year', event.target.value)
                  }
                />
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
