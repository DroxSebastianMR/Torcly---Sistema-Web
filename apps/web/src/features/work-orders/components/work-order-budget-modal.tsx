import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useFormState, useWatch } from 'react-hook-form'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import {
  createWorkOrderLineDraft,
  workOrderBudgetSchema,
  type WorkOrderBudgetFormValues,
  type WorkOrderLineDraft,
} from '../forms/work-order.schema'
import {
  useWorkOrderCatalog,
  useWorkOrdersMutations,
} from '../hooks/use-work-orders'
import type {
  WorkOrderBudgetInput,
  WorkOrderDetail,
  WorkOrderLineInput,
} from '../types/work-orders.types'
import {
  currencyFormatter,
  getWorkOrderErrorMessage,
  workOrderLineSubtotal,
} from '../utils/work-order-formatters'

interface WorkOrderBudgetModalProps {
  open: boolean
  order: WorkOrderDetail | null
  onClose: () => void
}

const emptyValues: WorkOrderBudgetFormValues = {
  addQuantity: 1,
  lines: [],
}

export function WorkOrderBudgetModal({
  open,
  order,
  onClose,
}: WorkOrderBudgetModalProps) {
  const mutations = useWorkOrdersMutations()
  const catalog = useWorkOrderCatalog()
  const { refetch: refetchCatalog } = catalog
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')

  const form = useForm<WorkOrderBudgetFormValues>({
    resolver: zodResolver(workOrderBudgetSchema),
    defaultValues: emptyValues,
  })
  const { reset, control, getValues, setValue, trigger } = form
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lines',
  })
  const lines = useWatch({ control, name: 'lines' })

  const busy = mutations.saveBudget.isPending
  const formState = useFormState({ control })
  const linesError = formState.errors.lines?.message
  const addQuantity = useWatch({ control, name: 'addQuantity' })

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + workOrderLineSubtotal(line), 0),
    [lines],
  )
  const total = Math.round((subtotal + Number.EPSILON) * 100) / 100

  const productOptions = useMemo<SmartSelectOption[]>(
    () =>
      (catalog.data?.products ?? []).map((product) => ({
        value: product.id,
        label: `${product.name} · ${product.code}`,
        meta: currencyFormatter.format(product.salePrice),
        searchTerms: [
          product.code,
          product.name,
          product.unit.symbol,
          currencyFormatter.format(product.salePrice),
        ],
      })),
    [catalog.data],
  )

  const serviceOptions = useMemo<SmartSelectOption[]>(
    () =>
      (catalog.data?.services ?? []).map((service) => ({
        value: service.id,
        label: `${service.name} · ${service.code}`,
        meta: currencyFormatter.format(service.price),
        searchTerms: [service.code, service.name],
      })),
    [catalog.data],
  )

  useEffect(() => {
    if (!open) return
    void refetchCatalog()
    reset(
      order && order.lines.length > 0
        ? {
            addQuantity: 1,
            lines: order.lines.map(
              (line): WorkOrderLineDraft => ({
                type: line.type,
                referenceId: line.productId ?? line.serviceId ?? '',
                name: line.name,
                code: line.code,
                unitLabel: line.unitLabel,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
              }),
            ),
          }
        : emptyValues,
    )
  }, [open, order, reset, refetchCatalog])

  const closeModal = () => {
    if (busy) return
    setSelectedProductId('')
    setSelectedServiceId('')
    onClose()
  }

  const addProduct = () => {
    if (!selectedProductId) {
      toast.error('Selecciona un producto.')
      return
    }
    const product = catalog.data?.products.find(
      (item) => item.id === selectedProductId,
    )
    if (!product) {
      toast.error('Selecciona un producto.')
      return
    }
    const quantity = Number(getValues('addQuantity'))
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser mayor a cero.')
      return
    }
    append(
      createWorkOrderLineDraft(
        {
          type: 'PRODUCT',
          referenceId: product.id,
          name: product.name,
          code: product.code,
          unitLabel: product.unit.symbol,
          unitPrice: product.salePrice,
        },
        quantity,
      ),
    )
    setSelectedProductId('')
  }

  const addService = () => {
    if (!selectedServiceId) {
      toast.error('Selecciona un servicio.')
      return
    }
    const service = catalog.data?.services.find(
      (item) => item.id === selectedServiceId,
    )
    if (!service) {
      toast.error('Selecciona un servicio.')
      return
    }
    append(
      createWorkOrderLineDraft(
        {
          type: 'SERVICE',
          referenceId: service.id,
          name: service.name,
          code: service.code,
          unitLabel: null,
          unitPrice: service.price,
        },
        1,
      ),
    )
    setSelectedServiceId('')
  }

  const buildInput = (): WorkOrderBudgetInput => {
    const linesInput: WorkOrderLineInput[] = getValues('lines').map((line) =>
      line.type === 'PRODUCT'
        ? {
            type: 'PRODUCT',
            productId: line.referenceId,
            quantity: Number(line.quantity),
          }
        : { type: 'SERVICE', serviceId: line.referenceId },
    )
    return { lines: linesInput }
  }

  const save = async ({ andSend }: { andSend: boolean }) => {
    const valid = await trigger()
    if (!valid) {
      const message =
        form.getFieldState('lines').error?.message ??
        'Revisa las líneas del presupuesto.'
      toast.error(message)
      return
    }
    if (!order) return
    const input = buildInput()
    try {
      const updated = await mutations.saveBudget.mutateAsync({
        id: order.id,
        input,
      })
      if (andSend) {
        await mutations.sendBudget.mutateAsync(order.id)
        toast.success('Presupuesto enviado al cliente.')
      } else {
        toast.success('Presupuesto guardado correctamente.')
      }
      void updated
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
    closeModal()
  }

  const updateQuantity = (index: number, value: number) => {
    const field = fields[index]
    if (!field) return
    update(index, { ...field, quantity: value })
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Presupuesto de la orden"
      description="Los precios quedan congelados para la orden al guardar."
      className="max-w-3xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void save({ andSend: false })}
          >
            {busy ? 'Guardando…' : 'Guardar borrador'}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void save({ andSend: true })}
          >
            {busy ? 'Guardando…' : 'Guardar y enviar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Agregar producto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_6.5rem_auto]">
              <SmartSelect
                value={selectedProductId}
                aria-label="Producto del presupuesto"
                placeholder="Seleccionar producto"
                searchPlaceholder="Buscar producto…"
                emptyMessage="No hay productos activos."
                options={productOptions}
                disabled={!catalog.data || busy}
                onChange={setSelectedProductId}
              />
              <Input
                type="number"
                min="0.001"
                step="0.001"
                aria-label="Cantidad del producto"
                value={addQuantity}
                onChange={(event) =>
                  setValue('addQuantity', Number(event.target.value))
                }
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={addProduct}
              >
                <Plus size={16} /> Agregar
              </Button>
            </div>
          </Field>
        </div>

        <Field label="Agregar servicio">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <SmartSelect
              value={selectedServiceId}
              aria-label="Servicio del presupuesto"
              placeholder="Seleccionar servicio"
              searchPlaceholder="Buscar servicio…"
              emptyMessage="No hay servicios activos."
              options={serviceOptions}
              disabled={!catalog.data || busy}
              onChange={setSelectedServiceId}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={addService}
            >
              <Plus size={16} /> Agregar
            </Button>
          </div>
        </Field>

        <div className="overflow-hidden rounded-xl border">
          <div className="divide-y">
            {fields.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aún no hay líneas. Agrega productos o servicios.
              </p>
            )}
            {fields.map((field, index) => {
              const line = field as WorkOrderLineDraft
              const invalidQuantity =
                !Number.isFinite(line.quantity) || line.quantity <= 0
              return (
                <div
                  key={field.id}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_7rem_2.25rem_6.5rem_2.25rem] sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {line.code} · {currencyFormatter.format(line.unitPrice)}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">Cant.</span>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    aria-label={`Cantidad de ${line.name}`}
                    value={String(line.quantity)}
                    onChange={(event) =>
                      updateQuantity(index, Number(event.target.value))
                    }
                    className={`h-10 w-full rounded-lg border bg-background px-3 text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-ring ${
                      invalidQuantity ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {line.unitLabel ?? ''}
                  </span>
                  <p className="text-right text-sm font-semibold tabular-nums">
                    {currencyFormatter.format(workOrderLineSubtotal(line))}
                  </p>
                  <button
                    type="button"
                    aria-label={`Quitar ${line.name}`}
                    onClick={() => remove(index)}
                    className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
          {linesError && (
            <p className="border-t px-4 py-2 text-xs text-red-600">
              {String(linesError)}
            </p>
          )}
          <div className="flex items-center justify-between border-t bg-[#f8faf9] px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {fields.length} {fields.length === 1 ? 'línea' : 'líneas'}
            </span>
            <div className="text-right">
              <p className="flex justify-between gap-6 text-muted-foreground">
                Subtotal
                <span className="tabular-nums">
                  {currencyFormatter.format(subtotal)}
                </span>
              </p>
              <p className="mt-1 flex justify-between gap-6 text-base font-bold text-brand-forest">
                Total
                <span className="tabular-nums">
                  {currencyFormatter.format(total)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {order && order.budgetSentAt && (
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <ClipboardList aria-hidden size={14} className="mt-0.5 shrink-0" />
            Este presupuesto ya fue enviado al cliente; al guardar se registrará
            un nuevo envío.
          </p>
        )}
      </div>
    </Modal>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{label}</span>
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
