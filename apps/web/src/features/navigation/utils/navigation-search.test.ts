import { describe, expect, it } from 'vitest'
import { appNavigation } from '../config/app-navigation'
import { flattenNavigation, searchNavigation } from './navigation-search'

describe('Búsqueda de navegación', () => {
  const items = flattenNavigation(appNavigation)
  it('encuentra etiquetas sin exigir tildes ni mayúsculas', () => {
    expect(searchNavigation(items, 'CODIGOS')[0].id).toBe('barcodes')
  })
  it('combina términos de módulo y grupo', () => {
    expect(
      searchNavigation(items, 'ventas comercial').map((item) => item.id),
    ).toEqual(['sales'])
  })
  it('devuelve una lista vacía sin coincidencias', () => {
    expect(searchNavigation(items, 'inexistente')).toEqual([])
  })
})
