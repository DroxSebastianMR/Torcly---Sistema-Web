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

export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <SystemFeedbackScreen
      kind={notFound ? 'not-found' : 'unexpected'}
      primaryAction={
        notFound
          ? {
              label: 'Volver al inicio',
              onClick: () => navigate(paths.dashboard),
            }
          : { label: 'Reintentar', onClick: () => window.location.reload() }
      }
      secondaryAction={
        notFound
          ? undefined
          : {
              label: 'Volver al inicio',
              onClick: () => navigate(paths.dashboard),
            }
      }
    />
  )
}

const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Navigate to={paths.dashboard} replace /> },
      ...publicRoutes,
      ...protectedRoutes,
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
