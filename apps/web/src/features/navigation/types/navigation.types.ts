import type { LucideIcon } from 'lucide-react'
import type { Permission } from '@/lib/permissions'

interface NavigationBase {
  id: string
  label: string
  icon: LucideIcon
  visible?: boolean
  disabled?: boolean
  permission?: Permission
}

export type NavigationItem = NavigationBase &
  (
    | { path: string; end?: boolean; children?: never; expandable?: false }
    | { expandable: true; children: readonly NavigationItem[]; path?: never }
  )

export interface NavigationGroup {
  id: string
  label: string
  visible?: boolean
  items: readonly NavigationItem[]
}

export interface SidebarAccount {
  name: string
  email: string
  initials: string
}

export interface SidebarViewProps {
  groups: readonly NavigationGroup[]
  account: SidebarAccount
  isSigningOut: boolean
  onLogout: () => Promise<void>
  onNavigate: () => void
}
