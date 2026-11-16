import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import {
  useCustomerMutations,
  useCustomers,
} from '@/features/customers/hooks/use-customers'
import type {
  CustomerCreateInput,
  CustomerType,
} from '@/features/customers/types/customers.types'
import { customerDisplayName } from '@/features/customers/utils/customer-formatters'
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles'
import { useSaleCatalog } from '@/features/sales/hooks/use-sales'
import type {
  QuotationCreateInput,
  QuotationDetail,
  QuotationItemInput,
} from '../types/quotations.types'
import { currencyFormatter } from '../utils/quotation-formatters'

interface QuotationFormModalProps {
  open: boolean
  quotation?: QuotationDetail | null
  loading?: boolean
  onClose: () => void
  onSubmit: (input: QuotationCreateInput) => Promise<void>
}

const emptyNewCustomer = {
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

const defaultValidityDays = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

export function QuotationFormModal({
  open,
  quotation,
  loading = false,
  onClose,
  onSubmit,
}: QuotationFormModalProps) {
  const catalog = useSaleCatalog(open)
  const customerMutations = useCustomerMutations()
  const customers = useCustomers(
    { search: '', type: 'all', page: 1, pageSize: 100 },
    open,
  )
  const vehicles = useVehicles({ search: '', page: 1, pageSize: 100 }, open)

  const [customerId, setCustomerId] = useState<string>(
    quotation?.customer?.id || '',
  )
  const [vehicleId, setVehicleId] = useState<string>(
    quotation?.vehicle?.id || '',
  )
  const [vehiclePlate, setVehiclePlate] = useState<string>(
    quotation?.vehiclePlate || '',
  )
  const [validUntil, setValidUntil] = useState<string>(
    quotation?.validUntil
      ? quotation.validUntil.split('T')[0]
      : defaultValidityDays(),
  )
  const [notes, setNotes] = useState<string>(quotation?.notes || '')
  const [items, setItems] = useState<QuotationItemInput[]>(
    quotation?.items?.map((item) => ({
      type: item.type,
      productId: item.productId,
      serviceId: item.serviceId,
      name: item.name,
      code: item.code,
      unitLabel: item.unitLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })) || [],
  )

  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [addQuantity, setAddQuantity] = useState(1)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [customerType, setCustomerType] = useState<CustomerType>('NATURAL')
  const [newCustomer, setNewCustomer] = useState(emptyNewCustomer)

  const customerOptions = useMemo<SmartSelectOption[]>(
    () =>
      (customers.data?.data ?? []).map((c) => {
        const name = customerDisplayName(c)
        return {
          value: c.id,
          label: `${name} · ${c.documentNumber}`,
          meta: c.phone ?? undefined,
          searchTerms: [name, c.documentNumber, c.phone ?? ''],
        }
      }),
    [customers.data],
  )

  const vehicleOptions = useMemo<SmartSelectOption[]>(
    () =>
      (!customerId
        ? []
        : (vehicles.data?.data ?? []).filter(
            (vehicle) => vehicle.customerId === customerId,
          )
      ).map((v) => ({
        value: v.id,
        label: `${v.plate} · ${v.brand} ${v.model}`,
        meta: `${v.year}`,
        searchTerms: [v.plate, v.brand, v.model],
      })),
    [vehicles.data, customerId],
  )

  const productOptions = useMemo<SmartSelectOption[]>(
    () =>
      (catalog.data?.products ?? []).map((p) => ({
        value: p.productId,
        label: `${p.name} (${p.code})`,
        meta: currencyFormatter.format(p.salePrice),
        searchTerms: [p.name, p.code],
      })),
    [catalog.data],
  )

  const serviceOptions = useMemo<SmartSelectOption[]>(
    () =>
      (catalog.data?.services ?? []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
        meta: currencyFormatter.format(s.price),
        searchTerms: [s.name, s.code],
      })),
    [catalog.data],
  )

  const addProduct = () => {
    if (!selectedProductId) return
    const product = catalog.data?.products.find(
      (p) => p.productId === selectedProductId,
    )
    if (!product) return

    setItems((prev) => [
      ...prev,
      {
        type: 'PRODUCT',
        productId: product.productId,
        name: product.name,
        code: product.code,
        unitLabel: product.unit.symbol,
        unitPrice: product.salePrice,
        quantity: Math.max(0.1, addQuantity),
      },
    ])
    setSelectedProductId('')
    setAddQuantity(1)
  }

  const addService = () => {
    if (!selectedServiceId) return
    const service = catalog.data?.services.find(
      (s) => s.id === selectedServiceId,
    )
    if (!service) return

    setItems((prev) => [
      ...prev,
      {
        type: 'SERVICE',
        serviceId: service.id,
        name: service.name,
        code: service.code,
        unitLabel: null,
        unitPrice: service.price,
        quantity: 1,
      },
    ])
    setSelectedServiceId('')
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item)),
    )
  }

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.round((item.unitPrice * item.quantity + Number.EPSILON) * 100) /
            100,
        0,
      ),
    [items],
  )

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto o servicio a la cotización.')
      return
    }

    let assignedCustomerId = customerId
    let assignedVehicleId = vehicleId
    let assignedPlate = vehiclePlate

    if (isNewCustomer) {
      const vehicle = {
        plate: newCustomer.plate.trim().toUpperCase(),
        brand: newCustomer.brand.trim(),
        model: newCustomer.model.trim(),
        year: Number(newCustomer.year),
      }
      const isValidCustomer =
        customerType === 'NATURAL'
          ? newCustomer.documentNumber.trim().length === 8 &&
            newCustomer.firstName.trim() &&
            newCustomer.lastName.trim()
          : newCustomer.documentNumber.trim().length === 11 &&
            newCustomer.legalName.trim()

      if (
        !isValidCustomer ||
        !newCustomer.phone.trim() ||
        !vehicle.plate ||
        !vehicle.brand ||
        !vehicle.model ||
        !vehicle.year
      ) {
        toast.error('Completa los datos obligatorios del cliente y vehículo.')
        return
      }

      const customerInput: CustomerCreateInput =
        customerType === 'NATURAL'
          ? {
              type: 'NATURAL',
              documentNumber: newCustomer.documentNumber.trim(),
              firstName: newCustomer.firstName.trim(),
              lastName: newCustomer.lastName.trim(),
              phone: newCustomer.phone.trim(),
              email: newCustomer.email.trim() || null,
              vehicle,
            }
          : {
              type: 'LEGAL',
              documentNumber: newCustomer.documentNumber.trim(),
              legalName: newCustomer.legalName.trim(),
              phone: newCustomer.phone.trim(),
              email: newCustomer.email.trim() || null,
              vehicle,
            }

      try {
        const created =
          await customerMutations.create.mutateAsync(customerInput)
        assignedCustomerId = created.data.id
        assignedVehicleId = created.data.createdVehicle?.id ?? ''
        assignedPlate = vehicle.plate
      } catch {
        toast.error('No se pudo registrar el cliente y su vehículo.')
        return
      }
    }

    if (!assignedCustomerId || !assignedVehicleId) {
      toast.error(
        'Selecciona un cliente y uno de sus vehículos, o registra uno nuevo.',
      )
      return
    }

    await onSubmit({
      customerId: assignedCustomerId,
      vehicleId: assignedVehicleId,
      vehiclePlate: assignedPlate.trim() || undefined,
      validUntil: validUntil || null,
      notes: notes.trim() || null,
      items,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quotation ? `Editar ${quotation.code}` : 'Nueva cotización'}
      description="Elabora una proforma con repuestos y mano de obra para compartir con el cliente."
      className="max-w-3xl"
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
            disabled={
              loading ||
              customerMutations.create.isPending ||
              items.length === 0
            }
            onClick={handleSubmit}
          >
            {loading || customerMutations.create.isPending
              ? 'Guardando…'
              : 'Guardar presupuesto'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Cliente y vehículo asignados a la cotización */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cliente *
            </label>
            <SmartSelect
              value={customerId}
              aria-label="Seleccionar cliente"
              placeholder="Seleccionar cliente…"
              searchPlaceholder="Buscar por nombre o DNI…"
              emptyMessage="Sin clientes registrados."
              options={customerOptions}
              disabled={isNewCustomer}
              onChange={(val) => {
                setCustomerId(val)
                setVehicleId('')
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vehículo *
            </label>
            <SmartSelect
              value={vehicleId}
              aria-label="Seleccionar vehículo"
              placeholder={
                customerId
                  ? 'Seleccionar vehículo…'
                  : 'Primero selecciona un cliente'
              }
              searchPlaceholder="Buscar por placa o modelo…"
              emptyMessage={
                customerId
                  ? 'No hay vehículos registrados para este cliente.'
                  : 'Selecciona primero un cliente.'
              }
              options={vehicleOptions}
              disabled={!customerId || isNewCustomer}
              onChange={(val) => {
                setVehicleId(val)
                const veh = vehicles.data?.data.find((v) => v.id === val)
                if (veh) setVehiclePlate(veh.plate)
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                ¿Es un cliente nuevo?
              </p>
              <p className="text-xs text-muted-foreground">
                Regístralo junto con su vehículo y asígnalo a la cotización.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isNewCustomer}
              aria-label="¿Es un cliente nuevo?"
              onClick={() => {
                setIsNewCustomer((current) => !current)
                setCustomerId('')
                setVehicleId('')
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isNewCustomer ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${isNewCustomer ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {isNewCustomer && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div className="flex gap-4 text-sm font-medium">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={customerType === 'NATURAL'}
                    onChange={() => setCustomerType('NATURAL')}
                  />
                  Persona natural
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={customerType === 'LEGAL'}
                    onChange={() => setCustomerType('LEGAL')}
                  />
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
                    setNewCustomer((current) => ({
                      ...current,
                      documentNumber: event.target.value.replace(/\D/g, ''),
                    }))
                  }
                />
                <Input
                  placeholder="Teléfono *"
                  value={newCustomer.phone}
                  onChange={(event) =>
                    setNewCustomer((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
                {customerType === 'NATURAL' ? (
                  <>
                    <Input
                      placeholder="Nombres *"
                      value={newCustomer.firstName}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Apellidos *"
                      value={newCustomer.lastName}
                      onChange={(event) =>
                        setNewCustomer((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </>
                ) : (
                  <Input
                    className="sm:col-span-2"
                    placeholder="Razón social *"
                    value={newCustomer.legalName}
                    onChange={(event) =>
                      setNewCustomer((current) => ({
                        ...current,
                        legalName: event.target.value,
                      }))
                    }
                  />
                )}
                <Input
                  className="sm:col-span-2"
                  placeholder="Correo electrónico (opcional)"
                  value={newCustomer.email}
                  onChange={(event) =>
                    setNewCustomer((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <Input
                  placeholder="Placa *"
                  value={newCustomer.plate}
                  onChange={(event) =>
                    setNewCustomer((current) => ({
                      ...current,
                      plate: event.target.value.toUpperCase(),
                    }))
                  }
                />
                <Input
                  placeholder="Marca *"
                  value={newCustomer.brand}
                  onChange={(event) =>
                    setNewCustomer((current) => ({
                      ...current,
                      brand: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Modelo *"
                  value={newCustomer.model}
                  onChange={(event) =>
                    setNewCustomer((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Año *"
                  value={newCustomer.year}
                  onChange={(event) =>
                    setNewCustomer((current) => ({
                      ...current,
                      year: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Válido hasta
          </label>
          <DatePicker
            id="quotation-valid-until"
            value={validUntil}
            onChange={setValidUntil}
            placeholder="Seleccionar fecha"
            min={new Date().toISOString().slice(0, 10)}
            align="right"
          />
        </div>

        {/* Agregar Productos y Servicios */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            Agregar ítems al presupuesto
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_5rem_auto]">
            <SmartSelect
              value={selectedProductId}
              aria-label="Seleccionar producto"
              placeholder="Seleccionar repuesto o producto…"
              searchPlaceholder="Buscar repuesto…"
              emptyMessage="Sin productos activos."
              options={productOptions}
              onChange={setSelectedProductId}
            />
            <Input
              type="number"
              min="0.1"
              step="1"
              value={addQuantity}
              onChange={(e) => setAddQuantity(Number(e.target.value))}
              className="text-center font-semibold tabular-nums"
            />
            <Button type="button" variant="outline" onClick={addProduct}>
              <Plus size={15} className="mr-1" /> Agregar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <SmartSelect
              value={selectedServiceId}
              aria-label="Seleccionar servicio"
              placeholder="Seleccionar mano de obra o servicio…"
              searchPlaceholder="Buscar servicio…"
              emptyMessage="Sin servicios activos."
              options={serviceOptions}
              onChange={setSelectedServiceId}
            />
            <Button type="button" variant="outline" onClick={addService}>
              <Plus size={15} className="mr-1" /> Agregar
            </Button>
          </div>
        </div>

        {/* Tabla de ítems presupuestados */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="divide-y divide-border">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aún no has agregado repuestos ni servicios a esta cotización.
              </p>
            )}
            {items.map((item, index) => (
              <div
                key={`${item.code}-${index}`}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_6rem_6.5rem_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.code} ·{' '}
                    {item.type === 'PRODUCT' ? 'Repuesto' : 'Mano de obra'} ·{' '}
                    {currencyFormatter.format(item.unitPrice)}
                  </p>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItemQuantity(index, Number(e.target.value))
                    }
                    className="min-h-8 text-center text-xs font-semibold tabular-nums"
                  />
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {currencyFormatter.format(
                      Math.round(
                        (item.unitPrice * item.quantity + Number.EPSILON) * 100,
                      ) / 100,
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Quitar ${item.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Resumen Total */}
          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </span>
            <div className="text-right">
              <span className="text-xs text-muted-foreground mr-2">
                Total Presupuestado:
              </span>
              <span className="text-lg font-bold text-brand-forest tabular-nums">
                {currencyFormatter.format(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notas u observaciones
          </label>
          <textarea
            rows={2}
            placeholder="Condiciones de pago, tiempo estimado de entrega, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
      </div>
    </Modal>
  )
}
