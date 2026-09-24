import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  productFormSchema,
  type ProductFormValues,
} from '../forms/product.schema'
import { useProductMutations } from '../hooks/use-products'
import type {
  Product,
  ProductInput,
  ProductOptions,
} from '../types/products.types'
import {
  getProductErrorMessage,
  numberFormatter,
} from '../utils/product-formatters'

interface ProductFormModalProps {
  open: boolean
  product: Product | null
  options?: ProductOptions
  onClose: () => void
}

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

const emptyValues: ProductFormValues = {
  code: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  unitId: '',
  salePrice: 0,
  minimumStock: 0,
}

export function ProductFormModal({
  open,
  product,
  options,
  onClose,
}: ProductFormModalProps) {
  const mutations = useProductMutations()
  const isEditing = product !== null
  const isSubmitting = mutations.create.isPending || mutations.update.isPending
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      product
        ? {
            code: product.code,
            barcode: product.barcode ?? '',
            name: product.name,
            description: product.description ?? '',
            categoryId: product.categoryId,
            brandId: product.brandId ?? '',
            unitId: product.unitId,
            salePrice: product.salePrice,
            minimumStock: product.minimumStock,
          }
        : emptyValues,
    )
  }, [form, open, product])

  const submit = form.handleSubmit(async (values) => {
    const input: ProductInput = {
      ...values,
      code: values.code.trim().toUpperCase(),
      barcode: values.barcode.trim() || null,
      name: values.name.trim(),
      description: values.description.trim() || null,
      brandId: values.brandId || null,
      salePrice: Number(values.salePrice),
      minimumStock: Number(values.minimumStock),
    }

    try {
      if (product) {
        await mutations.update.mutateAsync({ id: product.id, input })
        toast.success('Producto actualizado correctamente.')
      } else {
        await mutations.create.mutateAsync(input)
        toast.success('Producto registrado correctamente.')
      }
      onClose()
    } catch (error) {
      toast.error(getProductErrorMessage(error))
    }
  })

  const fieldError = (name: keyof ProductFormValues) => {
    const message = form.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar producto' : 'Registrar producto'}
      description="Completa la información comercial. Las existencias se administran desde Inventario."
      className="max-w-3xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-form"
            disabled={
              isSubmitting ||
              !options?.categories.length ||
              !options.units.length
            }
          >
            {isSubmitting ? 'Guardando…' : 'Guardar producto'}
          </Button>
        </div>
      }
    >
      {!options?.categories.length || !options.units.length ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Registra al menos una categoría y una unidad antes de guardar
          productos.
        </div>
      ) : null}

      {product && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Existencia disponible
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-forest">
              {numberFormatter.format(product.stock)} {product.unit.symbol}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Solo lectura</span>
        </div>
      )}

      <form
        id="product-form"
        onSubmit={submit}
        noValidate
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Código del producto"
            error={fieldError('code')}
            required
          >
            <Input
              {...form.register('code')}
              autoComplete="off"
              placeholder="Ej. REP-001"
              className="uppercase"
            />
          </Field>
          <Field
            label="Código de barras"
            error={fieldError('barcode')}
            hint="Opcional"
          >
            <Input
              {...form.register('barcode')}
              autoComplete="off"
              inputMode="numeric"
              placeholder="Escanea o digita el código"
            />
          </Field>
        </div>

        <Field label="Nombre del producto" error={fieldError('name')} required>
          <Input
            {...form.register('name')}
            placeholder="Nombre comercial del repuesto"
          />
        </Field>

        <Field
          label="Descripción"
          error={fieldError('description')}
          hint="Opcional"
        >
          <textarea
            {...form.register('description')}
            rows={3}
            placeholder="Características o aplicación del producto"
            className={`${inputClass} h-auto resize-y py-3`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Categoría" error={fieldError('categoryId')} required>
            <select {...form.register('categoryId')} className={inputClass}>
              <option value="">Seleccionar</option>
              {options?.categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Marca" error={fieldError('brandId')} hint="Opcional">
            <select {...form.register('brandId')} className={inputClass}>
              <option value="">Sin marca</option>
              {options?.brands.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unidad" error={fieldError('unitId')} required>
            <select {...form.register('unitId')} className={inputClass}>
              <option value="">Seleccionar</option>
              {options?.units.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.symbol})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Precio de venta"
            error={fieldError('salePrice')}
            required
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                S/
              </span>
              <Input
                {...form.register('salePrice', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="pl-9"
              />
            </div>
          </Field>
          <Field
            label="Stock mínimo"
            error={fieldError('minimumStock')}
            hint="Activa la alerta cuando se alcanza este nivel"
            required
          >
            <Input
              {...form.register('minimumStock', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.001"
            />
          </Field>
        </div>
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
