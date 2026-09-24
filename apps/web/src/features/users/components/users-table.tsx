import {
  MoreHorizontal,
  Pencil,
  Power,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react'
import type { User } from '../types/users.types'
import { dateFormatter } from '../utils/user-formatters'

interface UsersTableProps {
  users: User[]
  loading: boolean
  currentUserId: string
  canWrite: boolean
  onEdit: (user: User) => void
  onChangeRole: (user: User) => void
  onToggleStatus: (user: User) => void
}

export function UsersTable({
  users,
  loading,
  currentUserId,
  canWrite,
  onEdit,
  onChangeRole,
  onToggleStatus,
}: UsersTableProps) {
  if (loading) return <UsersSkeleton />

  if (!users.length) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-primary">
          <Users size={23} />
        </span>
        <h3 className="mt-4 font-semibold">No se encontraron usuarios</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ajusta los filtros o registra el primer usuario con acceso al sistema.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Ingreso</th>
              <th className="px-4 py-3">Estado</th>
              <th className="w-24 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              return (
                <tr key={user.id} className="group hover:bg-[#f9fbfa]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-xs font-bold text-primary">
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          className="block max-w-64 truncate text-left font-semibold text-foreground hover:text-primary"
                        >
                          {user.displayName}
                          {isCurrentUser && (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                              Tú
                            </span>
                          )}
                        </button>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          @{user.username} · {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/80 px-2 py-1 text-xs font-semibold">
                      <ShieldCheck size={13} className="text-primary" />
                      {user.roles[0]?.name ?? 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {dateFormatter(user.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge active={user.active} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <ActionButton
                        label={`Editar ${user.displayName}`}
                        title="Editar datos"
                        onClick={() => onEdit(user)}
                        disabled={!canWrite}
                      >
                        <Pencil size={16} />
                      </ActionButton>
                      <ActionButton
                        label={`Cambiar rol de ${user.displayName}`}
                        title="Cambiar rol"
                        onClick={() => onChangeRole(user)}
                        disabled={!canWrite || isCurrentUser}
                      >
                        <UserRoundCog size={16} />
                      </ActionButton>
                      <ActionButton
                        label={`${user.active ? 'Desactivar' : 'Activar'} ${user.displayName}`}
                        title={
                          user.active ? 'Desactivar usuario' : 'Activar usuario'
                        }
                        onClick={() => onToggleStatus(user)}
                        disabled={!canWrite || isCurrentUser}
                      >
                        <Power size={16} />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId
          return (
            <article key={user.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {user.displayName}
                    {isCurrentUser && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    @{user.username} · {user.email}
                  </p>
                </div>
                <StatusBadge active={user.active} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Info label="Rol" value={user.roles[0]?.name ?? 'Sin rol'} />
                <Info label="Ingreso" value={dateFormatter(user.createdAt)} />
              </div>
              {canWrite && (
                <div className="mt-4 flex gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium"
                  >
                    <Pencil size={15} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeRole(user)}
                    disabled={isCurrentUser}
                    className="flex size-10 items-center justify-center rounded-lg border disabled:opacity-40"
                    aria-label={`Cambiar rol de ${user.displayName}`}
                    title="Cambiar rol"
                  >
                    <UserRoundCog size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(user)}
                    disabled={isCurrentUser}
                    className="flex size-10 items-center justify-center rounded-lg border disabled:opacity-40"
                    aria-label={`${user.active ? 'Desactivar' : 'Activar'} ${user.displayName}`}
                    title={user.active ? 'Desactivar' : 'Activar'}
                  >
                    <Power size={16} />
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}

function ActionButton({
  label,
  title,
  onClick,
  disabled,
  children,
}: {
  label: string
  title: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function UsersSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando usuarios">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-28 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
