import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { PackagePlus, PackageMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import {
  movementFormSchema,
  type MovementFormKind,
  type MovementFormValues,
} from '../forms/movement.schema'
import {
  idempotencyKeyFor,
  movementKindLabel,
  useInventoryProductOptions,
  useMovementMutations,
} from '../hooks/use-inventory'
import {
  getInventoryErrorMessage,
  numberFormatter,
} from '../utils/inventory-formatters'

interface MovementFormModalProps {
  open: boolean
  kind: MovementFormKind
  onClose: () => void
}

const emptyValues: MovementFormValues = {
  productId: '',
  quantity: 1,
  sign: 'IN',
  notes: '',
}

export function MovementFormModal({
  open,
  kind,
  onClose,
}: MovementFormModalProps) {
  const mutations = useMovementMutations()
  const products = useInventoryProductOptions()
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: emptyValues,
  })
  const productId = useWatch({ control: form.control, name: 'productId' })
  const sign = useWatch({ control: form.control, name: 'sign' })
  const isAdjustment = kind === 'ADJUSTMENT'
  const { reset: resetForm, setError } = form

  const availableProducts = useMemo(
    () => (products.data ?? []).filter((product) => product.active),
    [products.data],
  )

  const selectedProduct = useMemo(
    () => availableProducts.find((product) => product.productId === productId),
    [availableProducts, productId],
  )

  useEffect(() => {
    if (!open) return
    resetForm(emptyValues)
  }, [open, resetForm])

  const activeMutation = isAdjustment
    ? mutations.adjustment
    : mutations[
        kind === 'INITIAL' ? 'initial' : kind === 'ENTRY' ? 'entry' : 'exit'
      ]

  const submit = form.handleSubmit(async (values) => {
    const quantity = Number(values.quantity)
    const applied = isAdjustment && values.sign === 'OUT' ? -quantity : quantity

    if (kind === 'EXIT' || (isAdjustment && values.sign === 'OUT')) {
      if (selectedProduct && quantity > selectedProduct.stock) {
        setError('quantity', {
          type: 'manual',
          message: `Solo hay ${numberFormatter.format(selectedProduct.stock)} ${selectedProduct.unit.symbol} disponibles.`,
        })
        return
      }
    }

    try {
      await activeMutation.mutateAsync({
        productId: values.productId,
        quantity: applied,
        idempotencyKey: idempotencyKeyFor(kind),
        notes: values.notes.trim() || undefined,
      })
      toast.success(`${movementKindLabel[kind]} registrado correctamente.`)
      onClose()
    } catch (error) {
      toast.error(getInventoryErrorMessage(error))
    }
  })

  const fieldError = (name: keyof MovementFormValues) => {
    const message = form.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  const kindIcon = kind === 'EXIT' ? PackageMinus : PackagePlus
  const KindIcon = kindIcon

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={movementKindLabel[kind]}
      description="El saldo final lo calcula el servidor de forma segura y con registro de auditoría."
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="movement-form"
            disabled={activeMutation.isPending}
          >
            {activeMutation.isPending
              ? 'Registrando…'
              : `Registrar ${movementKindLabel[kind].toLowerCase()}`}
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/70 px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KindIcon size={18} />
        </span>
        <p className="text-sm leading-5 text-muted-foreground">
          {kind === 'INITIAL'
            ? 'Solo puede registrarse una vez por producto. Es la base del saldo actual.'
            : kind === 'ADJUSTMENT'
              ? 'El ajuste se registra como ingreso (+) o egreso (−) y nunca deja el saldo negativo.'
              : kind === 'ENTRY'
                ? 'Registra el ingreso de mercadería al almacén.'
                : 'Registra la salida de mercadería. Se valida el saldo disponible.'}
        </p>
      </div>

      <form
        id="movement-form"
        onSubmit={submit}
        noValidate
        className="space-y-5"
      >
        <Field label="Producto" error={fieldError('productId')} required>
          <SmartSelect
            value={productId}
            placeholder="Buscar producto"
            aria-label="Producto"
            forceSearch
            options={availableProducts.map((product) => ({
              value: product.productId,
              label: `${product.name} · ${product.code}`,
              searchTerms: [product.code, product.name, product.unit.symbol],
            }))}
            onChange={(productId) =>
              form.setValue('productId', productId, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          {selectedProduct && (
            <p className="mt-2 flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Existencia disponible
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  selectedProduct.lowStock
                    ? 'text-amber-700'
                    : 'text-brand-forest'
                }`}
              >
                {numberFormatter.format(selectedProduct.stock)}{' '}
                {selectedProduct.unit.symbol}
              </span>
            </p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Cantidad"
            error={fieldError('quantity')}
            hint={
              kind === 'EXIT'
                ? 'No puede superar el saldo disponible'
                : undefined
            }
            required
          >
            <Input
              {...form.register('quantity', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.001"
              inputMode="decimal"
            />
          </Field>

          {isAdjustment ? (
            <Field label="Tipo de ajuste" required>
              <SmartSelect
                value={sign}
                placeholder="Seleccionar dirección"
                aria-label="Tipo de ajuste"
                options={[
                  { value: 'IN', label: 'Ingreso (+) agrega stock' },
                  { value: 'OUT', label: 'Egreso (−) reduce stock' },
                ]}
                onChange={(sign) =>
                  form.setValue('sign', sign as 'IN' | 'OUT', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </Field>
          ) : (
            <Field label="Referencia" error={undefined} hint="Opcional">
              <Input
                value=""
                disabled
                placeholder="Disponible en una próxima versión"
              />
            </Field>
          )}
        </div>

        <Field label="Notas" hint="Opcional">
          <textarea
            {...form.register('notes')}
            rows={2}
            placeholder="Motivo u observación del movimiento"
            className="h-auto w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
          />
        </Field>
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
