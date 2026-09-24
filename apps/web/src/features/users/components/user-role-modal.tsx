import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useUserMutations } from '../hooks/use-users'
import type { RoleOption, User } from '../types/users.types'
import { getUsersErrorMessage } from '../utils/user-formatters'

interface UserRoleModalProps {
  open: boolean
  user: User | null
  roles?: RoleOption[]
  onClose: () => void
}

const selectClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring'

export function UserRoleModal({
  open,
  user,
  roles,
  onClose,
}: UserRoleModalProps) {
  const mutations = useUserMutations()
  const currentRoleId = user?.roles[0]?.id ?? ''

  useEffect(() => {
    if (!open) return
  }, [open])

  if (!user) return null

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const roleId = String(formData.get('roleId'))
    if (!roleId || roleId === currentRoleId) {
      onClose()
      return
    }

    try {
      await mutations.role.mutateAsync({ id: user.id, roleId })
      toast.success('Rol actualizado correctamente.')
      onClose()
    } catch (error) {
      toast.error(getUsersErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cambiar rol"
      description={`Asigna el rol de acceso para ${user.displayName}. El cambio registra una auditoría y se aplica de inmediato.`}
      className="max-w-md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="user-role-form"
            disabled={mutations.role.isPending}
          >
            {mutations.role.isPending ? 'Guardando…' : 'Guardar rol'}
          </Button>
        </div>
      }
    >
      <div className="mb-5 rounded-xl bg-muted/70 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Usuario
        </p>
        <p className="mt-1 font-semibold text-brand-forest">
          @{user.username} · {user.email}
        </p>
      </div>
      <form
        id="user-role-form"
        onSubmit={submit}
        noValidate
        className="space-y-2"
      >
        <label className="block space-y-2 text-sm font-medium">
          <span>Nuevo rol</span>
          <select
            name="roleId"
            defaultValue={currentRoleId}
            className={selectClass}
            required
          >
            <option value="" disabled>
              Seleccionar rol
            </option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  )
}
