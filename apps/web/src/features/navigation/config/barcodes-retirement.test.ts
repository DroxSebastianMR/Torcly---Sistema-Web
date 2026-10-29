import { describe, expect, it } from 'vitest'
import { appNavigation } from './app-navigation'
import { paths } from '@/app/router/constants/paths'
import { endpoints } from '@/infrastructure/api/endpoints'
import { flattenNavigation, searchNavigation } from '../utils/navigation-search'

describe('Retiro del módulo de códigos de barras', () => {
  it('no existe la ruta de códigos de barras en paths', () => {
    expect('barcodes' in paths).toBe(false)
  })

  it('no existe el endpoint de códigos de barras en endpoints', () => {
    expect('barcodes' in endpoints).toBe(false)
  })

  it('no existe el ítem de códigos de barras en appNavigation', () => {
    const items = flattenNavigation(appNavigation)
    const found = items.find((item) => item.id === 'barcodes')
    expect(found).toBeUndefined()
  })

  it('la búsqueda global de navegación no retorna códigos de barras', () => {
    const items = flattenNavigation(appNavigation)
    expect(searchNavigation(items, 'barcodes')).toEqual([])
    expect(searchNavigation(items, 'codigos')).toEqual([])
  })
})
