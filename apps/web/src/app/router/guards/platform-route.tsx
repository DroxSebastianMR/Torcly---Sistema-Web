import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { paths } from '../constants/paths'

/**
 * Separa la consola interna de Torcly de la operación diaria de un taller.
 * La autorización del navegador es solo de experiencia; la API verifica
 * isPlatformAdmin nuevamente antes de entregar datos de plataforma.
 */
export function PlatformRoute() {
  const { user } = useAuth()

  return user?.isPlatformAdmin ? (
    <Outlet />
  ) : (
    <Navigate to={paths.dashboard} replace />
  )
}
