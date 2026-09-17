import { AppSidebarView } from '@/features/navigation/components/app-sidebar-view'
import { useAppSidebar } from '@/features/navigation/hooks/use-app-sidebar'

interface AppSidebarProps {
  onNavigate: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const sidebar = useAppSidebar()
  return <AppSidebarView {...sidebar} onNavigate={onNavigate} />
}
