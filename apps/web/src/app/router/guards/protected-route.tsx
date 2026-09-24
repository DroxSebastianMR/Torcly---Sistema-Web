import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { paths } from '../constants/paths'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/loading-screen'
export function ProtectedRoute() {
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <LoadingScreen
        title="Verificando tu sesión"
        description="Estamos validando tu acceso seguro a Torcly."
      />
    )
  if (error)
    return (
      <div role="alert" className="p-8">
        <p>No se pudo verificar la sesión. Comprueba la conexión con la API.</p>
        <Button onClick={retry}>Reintentar</Button>
      </div>
    )
  return user ? (
    <Outlet />
  ) : (
    <Navigate to={paths.login} state={{ from: location.pathname }} replace />
  )
}
