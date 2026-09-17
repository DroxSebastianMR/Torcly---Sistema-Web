import { useLocation } from 'react-router-dom'
import { useAppSidebar } from './use-app-sidebar'
import { flattenNavigation } from '../utils/navigation-search'
import { quickAccessIds } from '../config/header-actions'

export function useAppHeader() {
  const { pathname } = useLocation()
  const { groups, account, isSigningOut, onLogout } = useAppSidebar()
  const links = flattenNavigation(groups)
  const current = [...links]
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    )
  const quickAccess = quickAccessIds.flatMap((id) =>
    links.filter((item) => item.id === id),
  )
  return {
    links,
    current,
    quickAccess,
    account,
    isSigningOut,
    onLogout,
    profile: links.find((item) => item.id === 'profile'),
    notifications: links.find((item) => item.id === 'notifications'),
  }
}
