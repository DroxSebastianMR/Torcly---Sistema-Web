import { useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import type {
  PlatformOrganization,
  PlatformRole,
  UpdatePlatformOrganizationInput,
} from '../types/platform.types'

function OrganizationEditForm({
  organization,
  roles,
  onSubmit,
}: {
  organization: PlatformOrganization
  roles: PlatformRole[]
  onSubmit: (input: UpdatePlatformOrganizationInput) => Promise<void>
}) {
  const [values, setValues] = useState<UpdatePlatformOrganizationInput>(() => ({
    code: organization.code,
    name: organization.name,
    ownerRoleId: organization.owner?.role.id ?? '',
    ownerName: organization.owner?.displayName ?? '',
    ownerEmail: organization.owner?.email ?? '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField =
    (key: keyof UpdatePlatformOrganizationInput) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }))
      setErrors((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
    }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.name.trim() || values.name.trim().length < 3) {
      nextErrors.name = 'Ingresa el nombre del taller (mínimo 3 caracteres).'
    }
    if (
      !values.code.trim() ||
      !/^[a-z0-9][a-z0-9-]*$/.test(values.code.trim().toLowerCase()) ||
      values.code.trim().length < 3
    ) {
      nextErrors.code =
        'Usa al menos 3 caracteres: minúsculas, números y guiones.'
    }
    if (values.ownerName !== undefined && values.ownerName.trim().length < 2) {
      nextErrors.ownerName = 'Ingresa el nombre del responsable.'
    }
    if (
      values.ownerEmail !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.ownerEmail.trim())
    ) {
      nextErrors.ownerEmail = 'Ingresa un correo electrónico válido.'
    }
    if (!values.ownerRoleId) {
      nextErrors.ownerRoleId = 'Selecciona un rol para el responsable.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  return (
    <form
      id="organization-edit-form"
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!validate()) return
        void onSubmit({
          code: values.code.trim().toLowerCase(),
          name: values.name.trim(),
          ownerRoleId: values.ownerRoleId,
          ownerName: values.ownerName?.trim(),
          ownerEmail: values.ownerEmail?.trim().toLowerCase(),
        })
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del taller" error={errors.name} required>
          <Input
            value={values.name}
            onChange={setField('name')}
            invalid={Boolean(errors.name)}
            placeholder="Ej. Taller Mecánico Norte"
          />
        </Field>
        <Field
          label="Código único"
          error={errors.code}
          hint="Minúsculas, números y guiones; sin espacios."
          required
        >
          <Input
            value={values.code}
            onChange={setField('code')}
            invalid={Boolean(errors.code)}
            placeholder="Ej. taller-norte"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del responsable" error={errors.ownerName} required>
          <Input
            value={values.ownerName ?? ''}
            onChange={setField('ownerName')}
            invalid={Boolean(errors.ownerName)}
            placeholder="Ej. Carlos Mendoza"
          />
        </Field>
        <Field
          label="Correo del responsable"
          error={errors.ownerEmail}
          required
        >
          <Input
            type="email"
            value={values.ownerEmail ?? ''}
            onChange={setField('ownerEmail')}
            invalid={Boolean(errors.ownerEmail)}
            placeholder="carlos@taller.com"
          />
        </Field>
      </div>

      <Field label="Rol del responsable" error={errors.ownerRoleId} required>
        <SmartSelect
          value={values.ownerRoleId}
          onChange={(ownerRoleId) => {
            setValues((current) => ({ ...current, ownerRoleId }))
            setErrors((current) => {
              const next = { ...current }
              delete next.ownerRoleId
              return next
            })
          }}
          options={roles.map((role) => ({
            value: role.id,
            label: role.name,
            meta: role.code,
          }))}
          placeholder="Seleccionar rol"
          aria-label="Rol del responsable"
        />
      </Field>
    </form>
  )
}

export function OrganizationEditModal({
  organization,
  roles,
  busy,
  onClose,
  onSubmit,
}: {
  organization: PlatformOrganization | null
  roles: PlatformRole[]
  busy: boolean
  onClose: () => void
  onSubmit: (input: UpdatePlatformOrganizationInput) => Promise<void>
}) {
  return (
    <Modal
      open={Boolean(organization)}
      onClose={onClose}
      busy={busy}
      title="Editar organización"
      description="Actualiza los datos públicos del taller y de su responsable."
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
          <Button form="organization-edit-form" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      }
    >
      {organization ? (
        <OrganizationEditForm
          key={organization.id}
          organization={organization}
          roles={roles}
          onSubmit={onSubmit}
        />
      ) : null}
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
