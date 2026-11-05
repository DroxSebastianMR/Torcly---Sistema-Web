import { useState, type ChangeEvent } from 'react'
import { Plus, UserRound, UserRoundCheck, UserRoundX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import type {
  CreatePlatformOrganizationMemberInput,
  PlatformOrganization,
  PlatformOrganizationMember,
  PlatformRole,
} from '../types/platform.types'

const initialMember: CreatePlatformOrganizationMemberInput = {
  displayName: '',
  email: '',
  username: '',
  password: '',
  roleId: '',
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'No se pudo completar la operación. Inténtalo nuevamente.'
}

export function OrganizationMembersModal({
  organization,
  roles,
  members,
  loading,
  busy,
  onClose,
  onCreate,
  onUpdate,
}: {
  organization: PlatformOrganization | null
  roles: PlatformRole[]
  members: PlatformOrganizationMember[]
  loading: boolean
  busy: boolean
  onClose: () => void
  onCreate: (input: CreatePlatformOrganizationMemberInput) => Promise<void>
  onUpdate: (
    userId: string,
    input: { active?: boolean; roleId?: string },
  ) => Promise<void>
}) {
  const [formVisible, setFormVisible] = useState(false)
  const [values, setValues] = useState(initialMember)
  if (!organization) return null

  const setValue =
    (key: keyof CreatePlatformOrganizationMemberInput) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }))

  const submit = async () => {
    if (!values.roleId) {
      toast.error('Selecciona un rol para el miembro.')
      return
    }
    try {
      await onCreate({
        ...values,
        displayName: values.displayName.trim(),
        email: values.email.trim().toLowerCase(),
        username: values.username.trim().toLowerCase(),
      })
      setValues(initialMember)
      setFormVisible(false)
      toast.success('Miembro añadido al taller.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const toggle = async (member: PlatformOrganizationMember) => {
    try {
      await onUpdate(member.id, { active: !member.active })
      toast.success(
        member.active
          ? 'Acceso del miembro desactivado.'
          : 'Acceso del miembro reactivado.',
      )
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={`Miembros de ${organization.name}`}
      description="Cada miembro pertenece únicamente a este taller y recibe el rol seleccionado dentro de él."
      footer={
        <div className="flex justify-end">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Código:{' '}
            <span className="font-mono text-foreground">
              {organization.code}
            </span>
          </p>
          <Button
            size="sm"
            disabled={!organization.active || busy}
            onClick={() => setFormVisible((current) => !current)}
          >
            <Plus aria-hidden className="size-4" />
            Añadir miembro
          </Button>
        </div>

        {formVisible && (
          <form
            className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <label className="sm:col-span-2 text-sm font-medium">
              Nombre completo *
              <Input
                required
                value={values.displayName}
                onChange={setValue('displayName')}
                className="mt-1.5"
              />
            </label>
            <label className="text-sm font-medium">
              Correo *
              <Input
                required
                type="email"
                value={values.email}
                onChange={setValue('email')}
                className="mt-1.5"
              />
            </label>
            <label className="text-sm font-medium">
              Usuario *
              <Input
                required
                value={values.username}
                onChange={setValue('username')}
                className="mt-1.5"
              />
            </label>
            <label className="text-sm font-medium">
              Contraseña temporal *
              <Input
                required
                type="password"
                minLength={8}
                value={values.password}
                onChange={setValue('password')}
                className="mt-1.5"
              />
            </label>
            <label className="text-sm font-medium">
              Rol *
              <SmartSelect
                value={values.roleId}
                onChange={(roleId) =>
                  setValues((current) => ({ ...current, roleId }))
                }
                options={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                placeholder="Seleccionar rol"
                className="mt-1.5"
                aria-label="Rol del miembro"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormVisible(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={busy}>
                Guardar miembro
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((key) => (
              <div
                key={key}
                className="h-16 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : members.length ? (
          <div className="divide-y overflow-hidden rounded-xl border border-border">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-4 p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-forest">
                    {member.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email} · {member.role.name}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void toggle(member)}
                >
                  {member.active ? (
                    <UserRoundX aria-hidden className="size-4" />
                  ) : (
                    <UserRoundCheck aria-hidden className="size-4" />
                  )}
                  {member.active ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-7 text-center text-sm text-muted-foreground">
            <UserRound aria-hidden className="mx-auto mb-2 size-6" />
            Este taller todavía no tiene miembros.
          </div>
        )}
      </div>
    </Modal>
  )
}
