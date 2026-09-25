import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { userCreateSchema, userProfileSchema } from '../forms/users.schema'
import { useUserMutations } from '../hooks/use-users'
import type { RoleOption, User } from '../types/users.types'
import { getUsersErrorMessage } from '../utils/user-formatters'

interface UserFormModalProps {
  open: boolean
  user: User | null
  roles?: RoleOption[]
  onClose: () => void
}

type CreateValues = z.infer<typeof userCreateSchema>
type ProfileValues = z.infer<typeof userProfileSchema>

const emptyCreate: CreateValues = {
  username: '',
  email: '',
  displayName: '',
  password: '',
  roleId: '',
}

const emptyProfile: ProfileValues = { email: '', displayName: '' }

export function UserFormModal({
  open,
  user,
  roles,
  onClose,
}: UserFormModalProps) {
  const mutations = useUserMutations()
  const isEditing = user !== null
  const isSubmitting = mutations.create.isPending || mutations.update.isPending
  const createForm = useForm<CreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: emptyCreate,
  })
  const createRoleId = useWatch({ control: createForm.control, name: 'roleId' })
  const { reset: resetCreateForm } = createForm
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: emptyProfile,
  })
  const { reset: resetProfileForm } = profileForm

  useEffect(() => {
    if (!open) return
    if (user) {
      resetProfileForm({ email: user.email, displayName: user.displayName })
    } else {
      resetCreateForm(emptyCreate)
    }
  }, [open, resetCreateForm, resetProfileForm, user])

  const submitCreate = createForm.handleSubmit(async (values) => {
    try {
      await mutations.create.mutateAsync(values)
      toast.success('Usuario registrado correctamente.')
      onClose()
    } catch (error) {
      toast.error(getUsersErrorMessage(error))
    }
  })

  const submitEdit = profileForm.handleSubmit(async (values) => {
    if (!user) return
    try {
      await mutations.update.mutateAsync({ id: user.id, input: values })
      toast.success('Usuario actualizado correctamente.')
      onClose()
    } catch (error) {
      toast.error(getUsersErrorMessage(error))
    }
  })

  const createError = (name: keyof CreateValues) => {
    const message = createForm.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  const profileError = (name: keyof ProfileValues) => {
    const message = profileForm.formState.errors[name]?.message
    return message ? String(message) : undefined
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar usuario' : 'Registrar usuario'}
      description={
        isEditing
          ? 'Actualiza el correo y el nombre visible. La contraseña y el rol se administran por separado.'
          : 'Crea el acceso con sus datos y rol. La contraseña solo se asigna al crear la cuenta.'
      }
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={isEditing ? 'user-profile-form' : 'user-create-form'}
            disabled={isSubmitting || (!isEditing && !roles?.length)}
          >
            {isSubmitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar cambios'
                : 'Registrar usuario'}
          </Button>
        </div>
      }
    >
      {!isEditing && !roles?.length ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Registra al menos un rol antes de crear usuarios.
        </div>
      ) : null}

      {isEditing ? (
        <>
          {user && (
            <div className="mb-5 flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cuenta y rol actual
                </p>
                <p className="mt-1 font-semibold text-brand-forest">
                  @{user.username} · {user.roles[0]?.name ?? 'Sin rol'}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                Solo lectura
              </span>
            </div>
          )}
          <form
            id="user-profile-form"
            onSubmit={submitEdit}
            noValidate
            className="space-y-5"
          >
            <Field
              label="Correo electrónico"
              error={profileError('email')}
              required
            >
              <Input
                {...profileForm.register('email')}
                autoComplete="email"
                placeholder="usuario@torcly.local"
              />
            </Field>
            <Field
              label="Nombre visible"
              error={profileError('displayName')}
              hint="Como aparece en menús y registros"
              required
            >
              <Input
                {...profileForm.register('displayName')}
                placeholder="Nombre completo del usuario"
              />
            </Field>
          </form>
        </>
      ) : (
        <form
          id="user-create-form"
          onSubmit={submitCreate}
          noValidate
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre de usuario"
              error={createError('username')}
              hint="Se normaliza a minúsculas"
              required
            >
              <Input
                {...createForm.register('username')}
                autoComplete="off"
                placeholder="Ej. jperez"
              />
            </Field>
            <Field
              label="Nombre visible"
              error={createError('displayName')}
              required
            >
              <Input
                {...createForm.register('displayName')}
                placeholder="Nombre completo del usuario"
              />
            </Field>
          </div>
          <Field
            label="Correo electrónico"
            error={createError('email')}
            required
          >
            <Input
              {...createForm.register('email')}
              autoComplete="off"
              placeholder="usuario@torcly.local"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Contraseña inicial"
              error={createError('password')}
              hint="Mínimo 8 caracteres"
              required
            >
              <Input
                {...createForm.register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </Field>
            <Field label="Rol" error={createError('roleId')} required>
              <SmartSelect
                value={createRoleId}
                placeholder="Seleccionar rol"
                aria-label="Rol"
                options={
                  roles?.map((role) => ({
                    value: role.id,
                    label: role.name,
                  })) ?? []
                }
                onChange={(roleId) =>
                  createForm.setValue('roleId', roleId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </Field>
          </div>
        </form>
      )}
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
