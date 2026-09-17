import type { NavigationGroup, NavigationItem } from '../types/navigation.types'

export type NavigationLink = Extract<NavigationItem, { path: string }> & {
  group: string
}

export function flattenNavigation(
  groups: readonly NavigationGroup[],
): NavigationLink[] {
  const visit = (
    items: readonly NavigationItem[],
    group: string,
  ): NavigationLink[] =>
    items.flatMap((item) => {
      if (item.disabled || item.visible === false) return []
      return item.expandable
        ? visit(item.children, group)
        : [{ ...item, group }]
    })
  return groups.flatMap((group) => visit(group.items, group.label))
}
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
export function searchNavigation(
  items: readonly NavigationLink[],
  query: string,
) {
  const terms = normalize(query).split(/\s+/)
  return items.filter((item) =>
    terms.every((term) =>
      normalize(`${item.label} ${item.group}`).includes(term),
    ),
  )
}
