import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission, type Permission } from '@/lib/permissions'
export function PermissionRoute({ permission }: { permission: Permission }) {
  const { user } = useAuth()
  return user && hasPermission(user.permissions, permission) ? (
    <Outlet />
  ) : (
    <div role="alert">
      <h1 className="text-2xl font-semibold">Acceso restringido</h1>
      <p className="mt-3">
        Tu usuario no tiene permiso para consultar este módulo.
      </p>
    </div>
  )
}
