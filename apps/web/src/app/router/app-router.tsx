import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router-dom'
import { publicRoutes } from './routes/public.routes'
import { protectedRoutes } from './routes/protected.routes'
import { paths } from './constants/paths'
function RouteError() {
  const error = useRouteError()
  return (
    <main className="p-10">
      <h1 className="text-2xl font-semibold">
        {isRouteErrorResponse(error) && error.status === 404
          ? 'Página no encontrada'
          : 'No se pudo cargar la página'}
      </h1>
      <Link className="mt-5 block text-primary" to={paths.dashboard}>
        Volver al inicio
      </Link>
    </main>
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
