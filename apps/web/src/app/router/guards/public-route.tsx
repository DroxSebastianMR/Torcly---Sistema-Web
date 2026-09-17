import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { paths } from '../constants/paths'
export function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <p role="status" className="p-8">
        Verificando sesión…
      </p>
    )
  return user ? <Navigate to={paths.dashboard} replace /> : <Outlet />
}
