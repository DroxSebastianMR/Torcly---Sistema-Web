import { ClipboardList, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WorkshopTab = 'orders' | 'appointments'

interface WorkshopTabsProps {
  activeTab: WorkshopTab
  onTabChange: (tab: WorkshopTab) => void
  ordersCount?: number
  appointmentsCount?: number
}

export function WorkshopTabs({
  activeTab,
  onTabChange,
  ordersCount,
  appointmentsCount,
}: WorkshopTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'orders'}
        onClick={() => onTabChange('orders')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px',
          activeTab === 'orders'
            ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
        )}
      >
        <ClipboardList size={16} />
        <span>Órdenes de taller</span>
        {typeof ordersCount === 'number' && ordersCount > 0 && (
          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            {ordersCount}
          </span>
        )}
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'appointments'}
        onClick={() => onTabChange('appointments')}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px',
          activeTab === 'appointments'
            ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
        )}
      >
        <CalendarDays size={16} />
        <span>Citas programadas</span>
        {typeof appointmentsCount === 'number' && appointmentsCount > 0 && (
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
            {appointmentsCount}
          </span>
        )}
      </button>
    </div>
  )
}
