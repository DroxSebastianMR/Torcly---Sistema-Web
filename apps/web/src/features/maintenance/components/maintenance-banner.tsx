import { Wrench } from 'lucide-react'
import { useMaintenanceStatus } from '../hooks/use-maintenance'
import { formatWindowRange } from '../utils/maintenance-formatters'

export function MaintenanceBanner() {
  const { data } = useMaintenanceStatus()
  const window = data?.window
  if (!window || window.status !== 'active') return null

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-6 py-3 lg:px-10"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 text-sm text-amber-900">
        <Wrench aria-hidden className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-0.5">
          <p className="font-medium">{window.message}</p>
          <p className="text-xs text-amber-800">
            Ventana en curso:{' '}
            {formatWindowRange(window.startsAt, window.endsAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
