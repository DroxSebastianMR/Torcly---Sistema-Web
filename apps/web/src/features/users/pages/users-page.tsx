import { useDeferredValue, useState } from 'react'
import { Plus, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { UserFormModal } from '../components/user-form-modal'
import { UserRoleModal } from '../components/user-role-modal'
import { UsersTable } from '../components/users-table'
import { UsersToolbar } from '../components/users-toolbar'
import { useUserMutations, useUserRoles, useUsers } from '../hooks/use-users'
import type { User, UserFilters } from '../types/users.types'
import { getUsersErrorMessage } from '../utils/user-formatters'

const initialFilters: UserFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(currentUser?.permissions ?? [], 'users:write')

  const [filters, setFilters] = useState(initialFilters)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [roleUser, setRoleUser] = useState<User | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<User | null>(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const users = useUsers(queryFilters)
  const roles = useUserRoles()
  const mutations = useUserMutations()
  const total = users.data?.pagination.total ?? 0
  const visibleUsers = users.data?.data ?? []

  const openCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const toggleStatus = (user: User) => {
    setStatusTarget(user)
  }

  const confirmStatus = async () => {
    const user = statusTarget
    if (!user) return
    try {
      await mutations.status.mutateAsync({
        id: user.id,
        active: !user.active,
      })
      toast.success(
        user.active
          ? 'Acceso desactivado y sesiones revocadas.'
          : 'Acceso activado correctamente.',
      )
    } catch (error) {
      toast.error(getUsersErrorMessage(error))
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck size={15} /> Accesos al sistema
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Usuarios
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Administra las personas con acceso, su rol y el estado de su cuenta.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus size={17} /> Registrar usuario
          </Button>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRoundPlus size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                {total === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {visibleUsers.filter((user) => user.active).length}
            </p>
            <p className="text-xs text-muted-foreground">
              activos en esta página
            </p>
          </div>
          {users.isFetching && !users.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

        <UsersToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleUsers.map((user) => ({
            value: user.username,
            label: `${user.displayName} · @${user.username}`,
          }))}
        />

        {users.isError ? (
          <ErrorState
            title="No se pudo cargar los usuarios"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={users.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void users.refetch(),
            }}
          />
        ) : (
          <UsersTable
            users={visibleUsers}
            loading={users.isPending}
            currentUserId={currentUser?.id ?? ''}
            canWrite={canWrite}
            onEdit={(user) => {
              setRoleUser(null)
              setEditingUser(user)
              setFormOpen(true)
            }}
            onChangeRole={(user) => setRoleUser(user)}
            onToggleStatus={(user) => void toggleStatus(user)}
          />
        )}

        {users.data && users.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {users.data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={filters.page >= users.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Siguiente
              </Button>
            </div>
          </footer>
        )}
      </section>

      <UserFormModal
        open={formOpen}
        user={editingUser}
        roles={roles.data}
        onClose={() => setFormOpen(false)}
      />
      <UserRoleModal
        key={`${roleUser?.id ?? 'none'}:${roleUser?.roles[0]?.id ?? 'none'}`}
        open={roleUser !== null}
        user={roleUser}
        roles={roles.data}
        onClose={() => setRoleUser(null)}
      />
      <ConfirmationDialog
        open={statusTarget !== null}
        title={statusTarget?.active ? 'Desactivar acceso' : 'Reactivar acceso'}
        description={
          statusTarget
            ? `¿Confirmas que deseas ${
                statusTarget.active
                  ? 'desactivar el acceso de'
                  : 'reactivar el acceso de'
              } “${statusTarget.displayName}”? ${
                statusTarget.active
                  ? 'Su sesión se cerrará y no podrá iniciar sesión hasta que se active.'
                  : 'Podrá iniciar sesión nuevamente con sus credenciales.'
              }`
            : ''
        }
        variant={statusTarget?.active ? 'danger' : 'success'}
        confirmLabel={statusTarget?.active ? 'Desactivar' : 'Reactivar'}
        pending={mutations.status.isPending}
        onConfirm={confirmStatus}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  )
}
