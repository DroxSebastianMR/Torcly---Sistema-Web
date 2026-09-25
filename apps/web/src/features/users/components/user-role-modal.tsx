import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { useUserMutations } from '../hooks/use-users'
import type { RoleOption, User } from '../types/users.types'
import { getUsersErrorMessage } from '../utils/user-formatters'

interface UserRoleModalProps {
  open: boolean
  user: User | null
  roles?: RoleOption[]
  onClose: () => void
}

export function UserRoleModal({
  open,
  user,
  roles,
  onClose,
}: UserRoleModalProps) {
  const mutations = useUserMutations()
  const currentRoleId = user?.roles[0]?.id ?? ''
  const [roleId, setRoleId] = useState(currentRoleId)

  if (!user) return null

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
          <SmartSelect
            value={roleId}
            placeholder="Seleccionar rol"
            aria-label="Nuevo rol"
            options={
              roles?.map((role) => ({ value: role.id, label: role.name })) ?? []
            }
            onChange={setRoleId}
          />
        </label>
      </form>
    </Modal>
  )
}
