import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import {
  emptyOrganizationCreate,
  organizationCreateSchema,
  type OrganizationCreateValues,
} from '../forms/platform.schema'
import type {
  CreatePlatformOrganizationInput,
  PlatformRole,
} from '../types/platform.types'

export function OrganizationFormModal({
  open,
  roles,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean
  roles: PlatformRole[]
  busy: boolean
  onClose: () => void
  onSubmit: (input: CreatePlatformOrganizationInput) => Promise<void>
}) {
  const form = useForm<OrganizationCreateValues>({
    resolver: zodResolver(organizationCreateSchema),
    defaultValues: emptyOrganizationCreate,
    mode: 'onTouched',
  })

  const roleId = useWatch({ control: form.control, name: 'owner.roleId' })

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({
      code: values.code.trim().toLowerCase(),
      name: values.name.trim(),
      owner: {
        ...values.owner,
        displayName: values.owner.displayName.trim(),
        email: values.owner.email.trim().toLowerCase(),
        username: values.owner.username.trim().toLowerCase(),
      },
    })
  })

  const error = (name: 'name' | 'code') => form.formState.errors[name]?.message
  const ownerError = (name: keyof OrganizationCreateValues['owner']) =>
    form.formState.errors.owner?.[name]?.message

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title="Registrar organización"
      description="Crea el taller y su cuenta responsable. Esa cuenta solo podrá acceder al espacio operativo de su propia organización."
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button form="organization-form" type="submit" disabled={busy}>
            {busy ? 'Creando…' : 'Crear organización'}
          </Button>
        </div>
      }
    >
      <form
        id="organization-form"
        onSubmit={submit}
        noValidate
        className="space-y-6"
      >
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-brand-forest">
            Datos del taller
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del taller" error={error('name')} required>
              <Input
                {...form.register('name')}
                invalid={Boolean(error('name'))}
                placeholder="Ej. Taller Mecánico Norte"
              />
            </Field>
            <Field
              label="Código único"
              error={error('code')}
              hint="Minúsculas, números y guiones; sin espacios."
              required
            >
              <Input
                {...form.register('code')}
                invalid={Boolean(error('code'))}
                placeholder="Ej. taller-norte"
              />
            </Field>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <h3 className="text-sm font-semibold text-brand-forest">
            Responsable inicial
          </h3>

          <Field
            label="Nombre completo"
            error={ownerError('displayName')}
            required
          >
            <Input
              {...form.register('owner.displayName')}
              invalid={Boolean(ownerError('displayName'))}
              placeholder="Ej. María Torres"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Correo electrónico"
              error={ownerError('email')}
              required
            >
              <Input
                {...form.register('owner.email')}
                type="email"
                autoComplete="email"
                invalid={Boolean(ownerError('email'))}
                placeholder="Ej. responsable@taller.com"
              />
            </Field>
            <Field label="Usuario" error={ownerError('username')} required>
              <Input
                {...form.register('owner.username')}
                autoComplete="off"
                invalid={Boolean(ownerError('username'))}
                placeholder="Ej. maria.torres"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Contraseña temporal"
              error={ownerError('password')}
              hint="Mínimo 8 caracteres"
              required
            >
              <Input
                {...form.register('owner.password')}
                type="password"
                autoComplete="new-password"
                invalid={Boolean(ownerError('password'))}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Rol del taller" error={ownerError('roleId')} required>
              <SmartSelect
                value={roleId}
                options={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                  meta: role.code,
                }))}
                placeholder="Seleccionar rol"
                aria-label="Rol del responsable"
                onChange={(selectedRoleId) => {
                  form.setValue('owner.roleId', selectedRoleId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
              />
            </Field>
          </div>
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
