import { NavLink } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavigationItem } from '../types/navigation.types'

interface SidebarNavigationItemProps {
  item: NavigationItem
  onNavigate: () => void
}

const itemClassName =
  'group relative flex min-h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-accent [@media(max-height:700px)]:min-h-[30px]'

export function SidebarNavigationItem({
  item,
  onNavigate,
}: SidebarNavigationItemProps) {
  const Icon = item.icon
  if (item.disabled) {
    return (
      <li>
        <span
          aria-disabled="true"
          className={cn(itemClassName, 'cursor-not-allowed text-white/30')}
        >
          <Icon aria-hidden="true" size={17} />
          <span>{item.label}</span>
        </span>
      </li>
    )
  }
  if (item.expandable) {
    return (
      <li>
        <details className="group/submenu">
          <summary
            className={cn(
              itemClassName,
              'cursor-pointer list-none text-white/65 hover:bg-white/5 hover:text-white [&::-webkit-details-marker]:hidden',
            )}
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.6} />
            <span className="flex-1">{item.label}</span>
            <ChevronDown
              aria-hidden="true"
              size={14}
              className="group-open/submenu:rotate-180"
            />
          </summary>
          <ul className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-2">
            {item.children.map((child) => (
              <SidebarNavigationItem
                key={child.id}
                item={child}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </details>
      </li>
    )
  }
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            itemClassName,
            isActive
              ? 'bg-white/10 font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
              : 'text-white/65 hover:bg-white/5 hover:text-white',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute left-0 h-4 w-0.5 rounded-full bg-brand-accent"
              />
            )}
            <Icon
              aria-hidden="true"
              size={17}
              strokeWidth={1.6}
              className={cn(
                'shrink-0',
                isActive
                  ? 'text-brand-accent'
                  : 'text-white/45 group-hover:text-white/80',
              )}
            />
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}
