import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission, type Permission } from '@/lib/permissions'
import { SystemFeedbackScreen } from '@/components/ui/system-feedback-screen'
import { paths } from '../constants/paths'

export function PermissionRoute({ permission }: { permission: Permission }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (user && hasPermission(user.permissions, permission)) return <Outlet />
  return (
    <SystemFeedbackScreen
      kind="permission-denied"
      primaryAction={{
        label: 'Volver al inicio',
        onClick: () => navigate(paths.dashboard, { replace: true }),
      }}
    />
  )
}
