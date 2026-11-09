import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useCustomers } from '@/features/customers/hooks/use-customers'
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
  const customers = useCustomers({ search: '', type: 'all', page: 1, pageSize: 100 }, open)
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
      (vehicles.data?.data ?? [])
        .filter((v) => !customerId || v.customerId === customerId)
        .map((v) => ({
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
        (sum, item) => sum + Math.round((item.unitPrice * item.quantity + Number.EPSILON) * 100) / 100,
        0,
      ),
    [items],
  )

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto o servicio a la cotización.')
      return
    }

    await onSubmit({
      customerId: customerId || null,
      vehicleId: vehicleId || null,
      vehiclePlate: vehiclePlate.trim() || undefined,
      validUntil: validUntil || null,
      notes: notes.trim() || null,
      items,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quotation ? `Editar ${quotation.code}` : 'Nueva Cotización / Presupuesto'}
      description="Elabora una proforma con repuestos y mano de obra para compartir con el cliente."
      className="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading || items.length === 0} onClick={handleSubmit}>
            {loading ? 'Guardando…' : 'Guardar presupuesto'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Cliente y Vehículo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cliente
            </label>
            <SmartSelect
              value={customerId}
              aria-label="Seleccionar cliente"
              placeholder="Seleccionar cliente…"
              searchPlaceholder="Buscar por nombre o DNI…"
              emptyMessage="Sin clientes registrados."
              options={customerOptions}
              onChange={(val) => {
                setCustomerId(val)
                setVehicleId('')
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vehículo (Opcional)
            </label>
            <SmartSelect
              value={vehicleId}
              aria-label="Seleccionar vehículo"
              placeholder="Seleccionar vehículo…"
              searchPlaceholder="Buscar por placa o modelo…"
              emptyMessage="No hay vehículos registrados para este cliente."
              options={vehicleOptions}
              onChange={(val) => {
                setVehicleId(val)
                const veh = vehicles.data?.data.find((v) => v.id === val)
                if (veh) setVehiclePlate(veh.plate)
              }}
            />
          </div>
        </div>

        {/* Placa manual y Vigencia */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Placa tentativa / Referencia
            </label>
            <input
              type="text"
              placeholder="Ej: ABC-123"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Válido hasta
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
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
            <input
              type="number"
              min="0.1"
              step="1"
              value={addQuantity}
              onChange={(e) => setAddQuantity(Number(e.target.value))}
              className="h-10 rounded-lg border border-input bg-background px-2 text-center text-sm font-semibold tabular-nums"
            />
            <Button type="button" variant="outline" onClick={addProduct}>
              <Plus size={15} className="mr-1" /> Repuesto
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
              <Plus size={15} className="mr-1" /> Servicio
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
                    {item.code} · {item.type === 'PRODUCT' ? 'Repuesto' : 'Mano de obra'} ·{' '}
                    {currencyFormatter.format(item.unitPrice)}
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItemQuantity(index, Number(e.target.value))
                    }
                    className="h-8 w-full rounded border border-input bg-background px-2 text-center text-xs font-semibold tabular-nums"
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
              <span className="text-xs text-muted-foreground mr-2">Total Presupuestado:</span>
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
