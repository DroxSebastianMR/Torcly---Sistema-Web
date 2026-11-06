import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { useUnreadAnnouncementsCount } from '@/features/announcements/hooks/use-announcements'
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/use-notifications'
import { appNavigation } from '../config/app-navigation'
import { platformNavigation } from '../config/platform-navigation'
import { filterNavigation } from '../utils/filter-navigation'
import type { AccountSummary, NavigationGroup } from '../types/navigation.types'

export function useAppSidebar(
  configuration: readonly NavigationGroup[] = appNavigation,
) {
  const { user, logout } = useAuth()
  const { data: unreadData } = useUnreadNotificationsCount(
    Boolean(user && !user.isPlatformAdmin),
  )
  const { data: unreadAnnouncementsData } = useUnreadAnnouncementsCount(
    Boolean(user && !user.isPlatformAdmin),
  )
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pendingLogout = useRef(false)
  const navigation = user?.isPlatformAdmin ? platformNavigation : configuration
  const rawGroups = user ? filterNavigation(navigation, user.permissions) : []
  const unreadCount = unreadData?.count ?? 0
  const unreadAnnouncementsCount = unreadAnnouncementsData?.count ?? 0
  const groups = rawGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id === 'notifications') return { ...item, badge: unreadCount }
      if (item.id === 'announcements')
        return { ...item, badge: unreadAnnouncementsCount }
      return item
    }),
  }))
  const account: AccountSummary = {
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

  return { groups, account, isSigningOut, onLogout, user, unreadCount }
}
