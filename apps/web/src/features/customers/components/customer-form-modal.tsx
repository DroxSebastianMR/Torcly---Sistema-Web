import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { customerInputSchema, emptyCustomer } from '../forms/customers.schema'
import type { CustomerFormValues } from '../forms/customers.schema'
import { useCustomerMutations } from '../hooks/use-customers'
import type { Customer } from '../types/customers.types'
import {
  customerTypeLabel,
  documentLabel,
  getCustomersErrorMessage,
  mapCustomerFormValues,
  mapCustomerToFormValues,
} from '../utils/customer-formatters'

interface CustomerFormModalProps {
  open: boolean
  customer: Customer | null
  onClose: () => void
}

export function CustomerFormModal({
  open,
  customer,
  onClose,
}: CustomerFormModalProps) {
  const mutations = useCustomerMutations()
  const isEditing = customer !== null
  const isSubmitting = mutations.create.isPending || mutations.update.isPending
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: emptyCustomer,
  })
  const { reset } = form
  const customerType = useWatch({ control: form.control, name: 'type' })
  const isNatural = customerType === 'NATURAL'

  useEffect(() => {
    if (!open) return
    reset(customer ? mapCustomerToFormValues(customer) : emptyCustomer)
  }, [open, reset, customer])

  const submit = form.handleSubmit(async (values) => {
    try {
      const input = mapCustomerFormValues(values)
      if (isEditing && customer) {
        await mutations.update.mutateAsync({ id: customer.id, input })
      } else {
        await mutations.create.mutateAsync(input)
      }
      toast.success(
        isEditing
          ? 'Cliente actualizado correctamente.'
          : 'Cliente registrado correctamente.',
      )
      onClose()
    } catch (error) {
      toast.error(getCustomersErrorMessage(error))
    }
  })

  const error = (name: keyof CustomerFormValues) => {
    const message = form.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar cliente' : 'Registrar cliente'}
      description={
        isEditing
          ? 'Actualiza los datos del cliente. El documento identifica el registro.'
          : 'Registra una persona natural (DNI) o jurídica (RUC) con sus datos de contacto.'
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="customer-form" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar cambios'
                : 'Registrar cliente'}
          </Button>
        </div>
      }
    >
      <form
        id="customer-form"
        onSubmit={submit}
        noValidate
        className="space-y-5"
      >
        <Field
          label="Tipo de cliente"
          error={undefined}
          hint={
            isEditing ? 'El tipo no se puede cambiar al editar.' : undefined
          }
        >
          <SmartSelect
            value={customerType}
            aria-label="Tipo de cliente"
            disabled={isEditing}
            options={[
              { value: 'NATURAL', label: 'Persona natural' },
              { value: 'LEGAL', label: 'Persona jurídica' },
            ]}
            onChange={(type) => {
              form.setValue('type', type as CustomerFormValues['type'], {
                shouldValidate: true,
              })
              form.setValue('documentNumber', '', { shouldValidate: true })
              form.clearErrors([
                'documentNumber',
                'firstName',
                'lastName',
                'legalName',
              ])
            }}
          />
        </Field>

        <Field
          label={documentLabel(customerType)}
          error={error('documentNumber')}
          hint={isNatural ? '8 dígitos' : '11 dígitos'}
          required
        >
          <Input
            {...form.register('documentNumber')}
            inputMode="numeric"
            maxLength={isNatural ? 8 : 11}
            placeholder={isNatural ? 'Ej. 12345678' : 'Ej. 20123456789'}
          />
        </Field>

        {isNatural ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombres" error={error('firstName')} required>
              <Input
                {...form.register('firstName')}
                placeholder="Nombres del cliente"
              />
            </Field>
            <Field label="Apellidos" error={error('lastName')} required>
              <Input
                {...form.register('lastName')}
                placeholder="Apellidos del cliente"
              />
            </Field>
          </div>
        ) : (
          <Field label="Razón social" error={error('legalName')} required>
            <Input
              {...form.register('legalName')}
              placeholder="Razón social de la empresa"
            />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Teléfono"
            error={error('phone')}
            hint="Incluye el prefijo + si aplica"
            required
          >
            <Input
              {...form.register('phone')}
              inputMode="tel"
              placeholder="Ej. +51987654321"
            />
          </Field>
          <Field
            label="Correo electrónico"
            error={error('email')}
            hint="Opcional"
          >
            <Input
              {...form.register('email')}
              inputMode="email"
              autoComplete="email"
              placeholder="cliente@torcly.local"
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-brand-forest">
            {customerTypeLabel(customerType)} · {documentLabel(customerType)}
          </span>{' '}
          — el documento queda asociado de forma permanente a la ficha de este
          cliente.
        </p>
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
