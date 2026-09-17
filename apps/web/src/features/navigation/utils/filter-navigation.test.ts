import { describe, expect, it } from 'vitest'
import { LayoutDashboard } from 'lucide-react'
import { filterNavigation } from './filter-navigation'
import type { NavigationGroup, NavigationItem } from '../types/navigation.types'
const link: NavigationItem = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  path: '/dashboard',
  permission: 'dashboard:read',
}
const group = (items: NavigationItem[]): NavigationGroup[] => [
  { id: 'main', label: 'Principal', items },
]
describe('Configuración de navegación', () => {
  it('filtra permisos y elimina grupos vacíos', () => {
    expect(filterNavigation(group([link]), [])).toEqual([])
  })
  it('respeta visibilidad aunque exista permiso', () => {
    expect(
      filterNavigation(group([{ ...link, visible: false }]), [
        'dashboard:read',
      ]),
    ).toEqual([])
  })
  it('filtra hijos sin modificar la configuración', () => {
    const config = group([
      {
        id: 'parent',
        label: 'Grupo',
        icon: LayoutDashboard,
        expandable: true,
        children: [link],
      },
    ])
    expect(filterNavigation(config, [])).toEqual([])
    expect(filterNavigation(config, ['dashboard:read'])).toEqual(config)
  })
  it('conserva opciones deshabilitadas autorizadas', () => {
    expect(
      filterNavigation(group([{ ...link, disabled: true }]), [
        'dashboard:read',
      ])[0].items[0].disabled,
    ).toBe(true)
  })
})
