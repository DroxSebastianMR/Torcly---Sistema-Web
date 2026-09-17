import { hasPermission } from '@/lib/permissions'
import type { NavigationGroup, NavigationItem } from '../types/navigation.types'

function filterItems(
  items: readonly NavigationItem[],
  permissions: readonly string[],
): NavigationItem[] {
  return items.flatMap((item): NavigationItem[] => {
    if (
      item.visible === false ||
      (item.permission && !hasPermission(permissions, item.permission))
    )
      return []
    if (item.expandable) {
      const children = filterItems(item.children, permissions)
      return children.length ? [{ ...item, children }] : []
    }
    return [item]
  })
}

export function filterNavigation(
  groups: readonly NavigationGroup[],
  permissions: readonly string[],
): NavigationGroup[] {
  return groups.flatMap((group) => {
    if (group.visible === false) return []
    const items = filterItems(group.items, permissions)
    return items.length ? [{ ...group, items }] : []
  })
}
