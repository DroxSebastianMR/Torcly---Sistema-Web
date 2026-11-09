import { useState } from 'react'
import { Headphones, LogOut, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { platformService } from '@/features/platform/services/platform.service'
import { toast } from 'sonner'
import { paths } from '@/app/router/constants/paths'

export function ImpersonationBanner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isExiting, setIsExiting] = useState(false)

  if (!user?.impersonatedBy) return null

  const handleExit = async () => {
    try {
      setIsExiting(true)
      const response = await platformService.exitImpersonation()
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      })
      queryClient.setQueryData(['auth', 'session'], response.data)
      navigate(paths.platformOrganizations)
      toast.success('Sesión de asistencia técnica finalizada.')
    } catch {
      toast.error('No se pudo finalizar la sesión de soporte.')
    } finally {
      setIsExiting(false)
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-600/30 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-2 text-xs font-semibold text-amber-950 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-full bg-amber-950/15">
          <Headphones className="size-3.5 text-amber-950" />
        </span>
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="font-bold uppercase tracking-wider">
            Modo Soporte Activo:
          </span>
          <span>
            Visualizando como{' '}
            <strong className="underline">
              {user.organization?.name ?? 'Taller'}
            </strong>
          </span>
          <span className="hidden text-amber-900/80 sm:inline">
            (Operado por: {user.impersonatedBy.name})
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={isExiting}
        onClick={handleExit}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-950/20 bg-amber-950 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-amber-950 disabled:opacity-60"
      >
        {isExiting ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>Saliendo...</span>
          </>
        ) : (
          <>
            <LogOut className="size-3.5" />
            <span>Salir de Soporte</span>
          </>
        )}
      </button>
    </div>
  )
}
