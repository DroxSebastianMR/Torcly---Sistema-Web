import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { appNavigation } from '../config/app-navigation'
import { filterNavigation } from '../utils/filter-navigation'
import type { NavigationGroup, SidebarAccount } from '../types/navigation.types'

export function useAppSidebar(
  configuration: readonly NavigationGroup[] = appNavigation,
) {
  const { user, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pendingLogout = useRef(false)
  const groups = user ? filterNavigation(configuration, user.permissions) : []
  const account: SidebarAccount = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    initials:
      user?.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'T',
  }

  async function onLogout() {
    if (pendingLogout.current) return
    pendingLogout.current = true
    setIsSigningOut(true)
    try {
      await logout()
    } catch {
      toast.error('No se pudo cerrar la sesión. Intenta nuevamente.')
    } finally {
      pendingLogout.current = false
      setIsSigningOut(false)
    }
  }

  return { groups, account, isSigningOut, onLogout }
}
