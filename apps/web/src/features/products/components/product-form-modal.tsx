import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import {
  appendCatalogCodeSequence,
  normalizeCatalogCode,
  suggestProductCode,
} from '@/lib/catalog-code'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import {
  productFormSchema,
  type ProductFormValues,
} from '../forms/product.schema'
import {
  useProductCodeAvailability,
  useProductMutations,
} from '../hooks/use-products'
import { productsService } from '../services/products.service'
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
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  unitId: '',
  salePrice: 0,
  minimumStock: 1,
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
  const categoryId = useWatch({ control: form.control, name: 'categoryId' })
  const brandId = useWatch({ control: form.control, name: 'brandId' })
  const unitId = useWatch({ control: form.control, name: 'unitId' })
  const name = useWatch({ control: form.control, name: 'name' })
  const code = useWatch({ control: form.control, name: 'code' })
  const nameField = form.register('name')
  const [codeSequence, setCodeSequence] = useState(1)
  const rejectedCode = useRef('')
  const initializedForm = useRef('')
  const { reset: resetForm, setValue } = form
  const brandName = options?.brands.find((brand) => brand.id === brandId)?.name
  const baseCode = suggestProductCode(name ?? '', brandName)
  const normalizedCode = normalizeCatalogCode(code ?? '')
  const debouncedCode = useDebouncedValue(normalizedCode)
  const codeAvailability = useProductCodeAvailability(
    debouncedCode,
    product?.id,
    open,
  )

  useLayoutEffect(() => {
    if (!open) {
      initializedForm.current = ''
      return
    }
    const formKey = product ? `edit:${product.id}` : 'create'
    if (initializedForm.current === formKey) return
    initializedForm.current = formKey
    setCodeSequence(1)
    rejectedCode.current = ''
    resetForm(
      product
        ? {
            code: product.code,
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
  }, [open, product, resetForm])

  useEffect(() => {
    if (!open || product) return
    setValue('code', appendCatalogCodeSequence(baseCode, codeSequence), {
      shouldValidate: false,
    })
  }, [baseCode, codeSequence, open, product, setValue])

  useEffect(() => {
    if (
      product ||
      codeAvailability.isFetching ||
      codeAvailability.data?.available !== false ||
      !normalizedCode ||
      normalizedCode !== debouncedCode ||
      rejectedCode.current === normalizedCode
    ) {
      return
    }
    rejectedCode.current = normalizedCode
    setCodeSequence((current) => current + 1)
  }, [
    codeAvailability.data?.available,
    codeAvailability.isFetching,
    debouncedCode,
    normalizedCode,
    product,
  ])

  const submit = form.handleSubmit(async (values) => {
    const normalizedCode = normalizeCatalogCode(values.code)
    let availability
    try {
      availability = await productsService.checkCodeAvailability(
        normalizedCode,
        product?.id,
      )
    } catch (error) {
      toast.error(getProductErrorMessage(error))
      return
    }
    if (!availability.data.available) {
      form.setError('code', {
        type: 'validate',
        message: 'Este código ya pertenece a otro producto.',
      })
      return
    }

    const input: ProductInput = {
      ...values,
      code: normalizedCode,
      barcode: product?.barcode ?? null,
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
              codeAvailability.isFetching ||
              codeAvailability.data?.available === false ||
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
        onKeyDownCapture={(event) => {
          const target = event.target as HTMLInputElement
          if (event.key === 'Enter' && target.name === 'code') {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        noValidate
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Categoría" error={fieldError('categoryId')} required>
            <SmartSelect
              value={categoryId}
              placeholder="Seleccionar categoría"
              aria-label="Categoría"
              options={
                options?.categories.map((option) => ({
                  value: option.id,
                  label: option.name,
                })) ?? []
              }
              onChange={(categoryId) =>
                form.setValue('categoryId', categoryId, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </Field>
          <Field label="Marca" error={fieldError('brandId')} hint="Opcional">
            <SmartSelect
              value={brandId}
              placeholder="Sin marca"
              aria-label="Marca"
              options={
                options?.brands.map((option) => ({
                  value: option.id,
                  label: option.name,
                })) ?? []
              }
              onChange={(brandId) => {
                form.setValue('brandId', brandId, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                if (!product) {
                  setCodeSequence(1)
                  rejectedCode.current = ''
                }
              }}
            />
          </Field>
          <Field label="Unidad" error={fieldError('unitId')} required>
            <SmartSelect
              value={unitId}
              placeholder="Seleccionar unidad"
              aria-label="Unidad"
              options={
                options?.units.map((option) => ({
                  value: option.id,
                  label: `${option.name} (${option.symbol})`,
                })) ?? []
              }
              onChange={(unitId) =>
                form.setValue('unitId', unitId, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </Field>
        </div>

        <Field label="Nombre del producto" error={fieldError('name')} required>
          <Input
            {...nameField}
            placeholder="Nombre comercial del repuesto"
            onChange={(event) => {
              nameField.onChange(event)
              if (!product) {
                setCodeSequence(1)
                rejectedCode.current = ''
              }
            }}
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
              min="1"
              step="0.001"
            />
          </Field>
        </div>

        <Field label="Código del producto" error={fieldError('code')} required>
          <Input
            {...form.register('code')}
            readOnly
            aria-readonly="true"
            autoComplete="off"
            placeholder="Se genera automáticamente"
            className="cursor-default bg-muted/60 font-mono uppercase text-brand-forest"
          />
          <CodeAvailabilityHint
            code={normalizedCode}
            checking={codeAvailability.isFetching}
            available={codeAvailability.data?.available}
          />
        </Field>
      </form>
    </Modal>
  )
}

function CodeAvailabilityHint({
  code,
  checking,
  available,
}: {
  code: string
  checking: boolean
  available?: boolean
}) {
  const message = !code
    ? 'Se generará automáticamente al completar los datos del producto.'
    : checking
      ? 'Validando el código automático…'
      : available === false
        ? 'Generando una variante corta disponible…'
        : available
          ? 'Código automático disponible.'
          : 'Código generado automáticamente y protegido contra edición.'

  return (
    <span
      aria-live="polite"
      className={`block text-xs font-normal ${
        available === false ? 'text-red-600' : 'text-muted-foreground'
      }`}
    >
      {message}
    </span>
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
