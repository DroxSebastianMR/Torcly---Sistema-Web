import { useContext } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router-dom'
import { publicRoutes } from './routes/public.routes'
import { protectedRoutes } from './routes/protected.routes'
import { paths } from './constants/paths'
import { SystemFeedbackScreen } from '@/components/ui/system-feedback-screen'
import { AuthContext, useAuth } from '@/features/auth/hooks/auth-context'
import { LoadingScreen } from '@/components/ui/loading-screen'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return (
    <Navigate
      to={user?.isPlatformAdmin ? paths.platform : paths.dashboard}
      replace
    />
  )
}

export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const homePath = auth?.user?.isPlatformAdmin
    ? paths.platform
    : paths.dashboard

  return (
    <SystemFeedbackScreen
      kind={notFound ? 'not-found' : 'unexpected'}
      primaryAction={
        notFound
          ? {
              label: 'Volver al inicio',
              onClick: () => navigate(homePath),
            }
          : { label: 'Reintentar', onClick: () => window.location.reload() }
      }
      secondaryAction={
        notFound
          ? undefined
          : {
              label: 'Volver al inicio',
              onClick: () => navigate(homePath),
            }
      }
    />
  )
}

const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      ...publicRoutes,
      ...protectedRoutes,
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
