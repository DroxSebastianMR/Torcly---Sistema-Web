import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { paths } from '../constants/paths'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { SystemFeedbackScreen } from '@/components/ui/system-feedback-screen'
import { getFeedbackKindFromError } from '@/lib/feedback/feedback-from-error'

export function ProtectedRoute() {
  const { user, loading, error, errorDetail, retry } = useAuth()
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
      <SystemFeedbackScreen
        kind={getFeedbackKindFromError(errorDetail)}
        primaryAction={{ label: 'Reintentar', onClick: retry }}
        busy={loading}
      />
    )
  return user ? (
    <Outlet />
  ) : (
    <Navigate to={paths.login} state={{ from: location.pathname }} replace />
  )
}
