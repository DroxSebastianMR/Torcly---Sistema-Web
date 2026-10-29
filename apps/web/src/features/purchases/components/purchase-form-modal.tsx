import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Plus, Trash2, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { DatePicker } from '@/components/ui/date-picker'
import { SmartSelect } from '@/components/ui/smart-select'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { useProducts } from '@/features/products/hooks/use-products'
import { hasPermission } from '@/lib/permissions'
import {
  purchaseFormSchema,
  type PurchaseFormValues,
} from '../forms/purchase.schema'
import {
  useActiveSuppliers,
  usePurchaseMutations,
} from '../hooks/use-purchases'
import type { PurchaseDetail, PurchaseInput } from '../types/purchases.types'
import {
  currencyFormatter,
  getPurchaseErrorMessage,
} from '../utils/purchase-formatters'

interface PurchaseFormModalProps {
  open: boolean
  purchase: PurchaseDetail | null
  onClose: () => void
}

const todayStr = () => new Date().toISOString().split('T')[0]!

const emptyValues: PurchaseFormValues = {
  supplierId: '',
  purchaseDate: todayStr(),
  externalRef: '',
  notes: '',
  lines: [],
}

export function PurchaseFormModal({
  open,
  purchase,
  onClose,
}: PurchaseFormModalProps) {
  const { user } = useAuth()
  const canWrite = hasPermission(user?.permissions ?? [], 'purchases:write')
  const mutations = usePurchaseMutations()
  const suppliers = useActiveSuppliers(open)
  const productsQuery = useProducts({
    search: '',
    categoryId: '',
    status: 'active',
    page: 1,
    pageSize: 100,
  })

  const products = useMemo(
    () => productsQuery.data?.data ?? [],
    [productsQuery.data?.data],
  )

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: emptyValues,
  })
  const { reset, control, register, handleSubmit, setValue, formState } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })
  const rawLines = useWatch({ control, name: 'lines' })
  const supplierId = useWatch({ control, name: 'supplierId' })
  const purchaseDate = useWatch({ control, name: 'purchaseDate' })
  const lines = useMemo(() => rawLines ?? [], [rawLines])

  const total = useMemo(() => {
    return lines.reduce(
      (sum, line) =>
        sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0),
      0,
    )
  }, [lines])

  const isEditing = purchase !== null
  const busy =
    mutations.createPurchase.isPending || mutations.updatePurchase.isPending

  useEffect(() => {
    if (open && purchase) {
      reset({
        supplierId: purchase.supplier.id,
        purchaseDate: purchase.purchaseDate,
        externalRef: purchase.externalRef ?? '',
        notes: purchase.notes ?? '',
        lines: purchase.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitCost,
          productName: l.productName,
          productCode: l.productCode,
          unitLabel: l.unitLabel,
        })),
      })
    } else if (open && !purchase) {
      reset({ ...emptyValues, purchaseDate: todayStr() })
    }
  }, [open, purchase, reset])

  const handleProductSelect = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId)
    setValue(`lines.${index}.productId`, productId)
    if (selected) {
      setValue(`lines.${index}.productName`, selected.name)
      setValue(`lines.${index}.productCode`, selected.code)
      setValue(`lines.${index}.unitLabel`, selected.unit?.symbol ?? null)
    }
  }

  const onSubmit = async (values: PurchaseFormValues) => {
    if (!canWrite) return
    const input: PurchaseInput = {
      supplierId: values.supplierId,
      purchaseDate: values.purchaseDate,
      externalRef: values.externalRef?.trim() || null,
      notes: values.notes?.trim() || null,
      lines: values.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitCost: l.unitCost,
      })),
    }

    try {
      if (isEditing && purchase) {
        await mutations.updatePurchase.mutateAsync({
          id: purchase.id,
          input,
        })
        toast.success('Borrador de compra actualizado.')
      } else {
        await mutations.createPurchase.mutateAsync(input)
        toast.success('Compra creada en borrador exitosamente.')
      }
      onClose()
    } catch (error) {
      toast.error(getPurchaseErrorMessage(error))
    }
  }

  const addLine = () => {
    append({
      productId: '',
      quantity: 1,
      unitCost: 0,
      productName: '',
      productCode: '',
      unitLabel: null,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar borrador de compra' : 'Nueva compra'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="purchaseSupplierId" className="text-sm font-medium">
              Proveedor <span className="text-destructive">*</span>
            </label>
            <SmartSelect
              id="purchaseSupplierId"
              value={supplierId}
              placeholder="Selecciona un proveedor…"
              options={[
                { value: '', label: 'Selecciona un proveedor…' },
                ...(suppliers.data?.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.legalName,
                  meta: supplier.documentNumber,
                })) ?? []),
              ]}
              onChange={(value) =>
                setValue('supplierId', value, { shouldValidate: true })
              }
              aria-invalid={Boolean(formState.errors.supplierId)}
            />
            {formState.errors.supplierId && (
              <p className="text-xs text-destructive" role="alert">
                {formState.errors.supplierId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="purchaseDate" className="text-sm font-medium">
              Fecha de compra <span className="text-destructive">*</span>
            </label>
            <DatePicker
              id="purchaseDate"
              value={purchaseDate}
              onChange={(value) =>
                setValue('purchaseDate', value, { shouldValidate: true })
              }
              aria-invalid={Boolean(formState.errors.purchaseDate)}
            />
            {formState.errors.purchaseDate && (
              <p className="text-xs text-destructive" role="alert">
                {formState.errors.purchaseDate.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="externalRef" className="text-sm font-medium">
            Referencia externa (Factura / Guía)
          </label>
          <Input
            id="externalRef"
            placeholder="Ej. F001-000432"
            {...register('externalRef')}
            aria-invalid={Boolean(formState.errors.externalRef)}
          />
          {formState.errors.externalRef && (
            <p className="text-xs text-destructive" role="alert">
              {formState.errors.externalRef.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Productos</h3>
              <p className="text-xs text-muted-foreground">
                Agrega repuestos existentes e ingresa la cantidad y costo
                unitario acordado.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addLine}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <Plus size={14} />
              Agregar ítem
            </Button>
          </div>

          {formState.errors.lines?.message && (
            <p className="mb-2 text-xs text-destructive" role="alert">
              {formState.errors.lines.message}
            </p>
          )}

          {fields.length === 0 ? (
            <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              <PackagePlus size={24} className="mb-1 opacity-50" aria-hidden />
              <span>No hay productos agregados a la compra.</span>
              <span className="text-xs">
                Haz clic en &quot;Agregar ítem&quot; para comenzar.
              </span>
            </div>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {fields.map((field, index) => {
                const currentProductId = lines[index]?.productId ?? ''
                const currentQty = Number(lines[index]?.quantity) || 0
                const currentCost = Number(lines[index]?.unitCost) || 0
                const lineSubtotal = currentQty * currentCost

                return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={`line-product-${index}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Producto
                      </label>
                      <SmartSelect
                        id={`line-product-${index}`}
                        value={currentProductId}
                        placeholder="Selecciona un producto…"
                        options={[
                          { value: '', label: 'Selecciona un producto…' },
                          ...products.map((product) => ({
                            value: product.id,
                            label: `${product.code} · ${product.name}`,
                            meta: product.unit?.symbol ?? undefined,
                            disabled: lines.some(
                              (line, lineIndex) =>
                                lineIndex !== index &&
                                line.productId === product.id,
                            ),
                          })),
                        ]}
                        onChange={(value) => handleProductSelect(index, value)}
                        aria-label={`Producto para línea ${index + 1}`}
                      />
                      {formState.errors.lines?.[index]?.productId && (
                        <p className="text-xs text-destructive" role="alert">
                          {formState.errors.lines[index]?.productId?.message}
                        </p>
                      )}
                    </div>

                    <div className="w-28 space-y-1">
                      <label
                        htmlFor={`line-qty-${index}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Cantidad
                      </label>
                      <Input
                        id={`line-qty-${index}`}
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="1"
                        {...register(`lines.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        aria-label={`Cantidad línea ${index + 1}`}
                        className="text-right text-xs"
                      />
                      {formState.errors.lines?.[index]?.quantity && (
                        <p className="text-xs text-destructive" role="alert">
                          {formState.errors.lines[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    <div className="w-28 space-y-1">
                      <label
                        htmlFor={`line-cost-${index}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Costo Unit.
                      </label>
                      <Input
                        id={`line-cost-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register(`lines.${index}.unitCost`, {
                          valueAsNumber: true,
                        })}
                        aria-label={`Costo unitario línea ${index + 1}`}
                        className="text-right text-xs"
                      />
                      {formState.errors.lines?.[index]?.unitCost && (
                        <p className="text-xs text-destructive" role="alert">
                          {formState.errors.lines[index]?.unitCost?.message}
                        </p>
                      )}
                    </div>

                    <div className="w-28 text-right">
                      <span className="text-xs text-muted-foreground block">
                        Subtotal
                      </span>
                      <span className="font-mono text-sm font-semibold">
                        {currencyFormatter.format(lineSubtotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Eliminar producto ${index + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" className="text-sm font-medium">
            Observaciones
          </label>
          <textarea
            id="notes"
            rows={2}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Notas u observaciones de la compra…"
            {...register('notes')}
          />
          {formState.errors.notes && (
            <p className="text-xs text-destructive" role="alert">
              {formState.errors.notes.message}
            </p>
          )}
        </div>

        {fields.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Total de la compra:
            </span>
            <span className="text-lg font-bold text-primary">
              {currencyFormatter.format(total)}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy
              ? 'Guardando…'
              : isEditing
                ? 'Actualizar borrador'
                : 'Guardar borrador'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
