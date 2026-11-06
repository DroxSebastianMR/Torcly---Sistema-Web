import { useState, useEffect, type ChangeEvent } from 'react'
import {
  Check,
  Clock,
  Copy,
  KeyRound,
  Plus,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  X,
} from 'lucide-react'
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

export function OrganizationMembersModal(props: {
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
  onResetPassword?: (userId: string) => Promise<{ temporaryPassword: string }>
}) {
  if (!props.organization) return null

  return (
    <OrganizationMembersDialog {...props} organization={props.organization} />
  )
}

function OrganizationMembersDialog({
  organization,
  roles,
  members,
  loading,
  busy,
  onClose,
  onCreate,
  onUpdate,
  onResetPassword,
}: {
  organization: PlatformOrganization
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
  onResetPassword?: (userId: string) => Promise<{ temporaryPassword: string }>
}) {
  const [formVisible, setFormVisible] = useState(false)
  const [values, setValues] = useState(initialMember)
  const [resetResult, setResetResult] = useState<{
    memberId: string
    memberName: string
    temporaryPassword: string
    secondsLeft: number
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const temporaryPassword = resetResult?.temporaryPassword

  useEffect(() => {
    if (!temporaryPassword) return

    const interval = setInterval(() => {
      setResetResult((prev) => {
        if (!prev) return null
        if (prev.secondsLeft <= 1) {
          toast.info('La clave temporal ha expirado por seguridad.')
          return null
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [temporaryPassword])

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

  const resetPassword = async (member: PlatformOrganizationMember) => {
    if (!onResetPassword) return
    try {
      const response = await onResetPassword(member.id)
      setResetResult({
        memberId: member.id,
        memberName: member.displayName,
        temporaryPassword: response.temporaryPassword,
        secondsLeft: 60,
      })
      setCopied(false)
      toast.success('Contraseña temporal generada con éxito.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const copyResetPassword = async () => {
    if (!resetResult) return
    try {
      await navigator.clipboard.writeText(resetResult.temporaryPassword)
      setCopied(true)
      toast.success('Contraseña copiada al portapapeles.')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Copia la contraseña manualmente.')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={`Miembros de ${organization.name}`}
      description="Cada miembro pertenece únicamente a este taller y recibe el rol seleccionado dentro de él."
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
              <div key={member.id} className="transition-colors">
                <div className="flex items-center justify-between gap-4 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-forest">
                      {member.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email} · {member.role.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onResetPassword && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        title="Restablecer contraseña"
                        disabled={busy}
                        onClick={() => void resetPassword(member)}
                      >
                        <KeyRound aria-hidden className="size-4" />
                        <span className="hidden sm:inline">Clave</span>
                      </Button>
                    )}
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
                </div>

                {resetResult?.memberId === member.id && (
                  <div className="border-t border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-emerald-900">
                        Clave temporal emitida para {resetResult.memberName}:
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-800">
                          <Clock
                            aria-hidden
                            className="size-3 text-emerald-700"
                          />
                          Expira en {resetResult.secondsLeft}s
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetResult(null)}
                          className="rounded p-0.5 text-emerald-700 hover:bg-emerald-200/60 hover:text-emerald-950 transition-colors"
                          title="Cerrar aviso de clave"
                          aria-label="Cerrar clave temporal"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-white p-2">
                      <code className="select-all font-mono text-sm font-bold tracking-wide text-brand-forest">
                        {resetResult.temporaryPassword}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copyResetPassword()}
                        className="h-8 gap-1 text-xs"
                      >
                        {copied ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copied ? 'Copiada' : 'Copiar'}
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-800">
                      Entrega esta clave al usuario. Al ingresar, se le exigirá
                      cambiarla de inmediato. Se ocultará automáticamente al
                      expirar.
                    </p>
                  </div>
                )}
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
