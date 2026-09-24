import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { paths } from '../constants/paths'
import { LoadingScreen } from '@/components/ui/loading-screen'
export function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <LoadingScreen
        title="Verificando tu sesión"
        description="Estamos preparando tu acceso a Torcly."
      />
    )
  return user ? <Navigate to={paths.dashboard} replace /> : <Outlet />
}
