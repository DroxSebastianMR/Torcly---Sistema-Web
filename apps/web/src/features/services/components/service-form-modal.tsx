import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  serviceFormSchema,
  type ServiceFormValues,
} from '../forms/service.schema'
import { useServiceMutations } from '../hooks/use-services'
import type { Service, ServiceInput } from '../types/services.types'
import {
  currencyFormatter,
  getServiceErrorMessage,
} from '../utils/service-formatters'

interface ServiceFormModalProps {
  open: boolean
  service: Service | null
  onClose: () => void
}

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

const emptyValues: ServiceFormValues = {
  code: '',
  name: '',
  description: '',
  price: 0,
}

export function ServiceFormModal({
  open,
  service,
  onClose,
}: ServiceFormModalProps) {
  const mutations = useServiceMutations()
  const isEditing = service !== null
  const isSubmitting = mutations.create.isPending || mutations.update.isPending
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyValues,
  })
  const { reset: resetForm } = form

  useEffect(() => {
    if (!open) return
    resetForm(
      service
        ? {
            code: service.code,
            name: service.name,
            description: service.description ?? '',
            price: service.price,
          }
        : emptyValues,
    )
  }, [open, service, resetForm])

  const submit = form.handleSubmit(async (values) => {
    const input: ServiceInput = {
      ...values,
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description.trim() || null,
      price: Number(values.price),
    }

    try {
      if (service) {
        await mutations.update.mutateAsync({ id: service.id, input })
        toast.success('Servicio actualizado correctamente.')
      } else {
        await mutations.create.mutateAsync(input)
        toast.success('Servicio registrado correctamente.')
      }
      onClose()
    } catch (error) {
      toast.error(getServiceErrorMessage(error))
    }
  })

  const fieldError = (name: keyof ServiceFormValues) => {
    const message = form.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  const stopImplicitSubmit: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar servicio' : 'Registrar servicio'}
      description="Define el servicio automotriz y su tarifa comercial."
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="service-form" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar servicio'}
          </Button>
        </div>
      }
    >
      {service && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tarifa vigente
            </p>
            <p className="mt-1 text-xl font-semibold text-brand-forest">
              {currencyFormatter.format(service.price)}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Se actualizará al guardar
          </span>
        </div>
      )}

      <form
        id="service-form"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Código del servicio"
            error={fieldError('code')}
            required
          >
            <Input
              {...form.register('code')}
              autoComplete="off"
              placeholder="Ej. CAMBIO-BOMBA"
              className="uppercase"
              onKeyDown={stopImplicitSubmit}
            />
          </Field>
          <Field label="Precio" error={fieldError('price')} required>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                S/
              </span>
              <Input
                {...form.register('price', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        <Field label="Nombre del servicio" error={fieldError('name')} required>
          <Input
            {...form.register('name')}
            placeholder="Nombre comercial del servicio"
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
            placeholder="Alcance o detalle del servicio"
            className={`${inputClass} h-auto resize-y py-3`}
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
