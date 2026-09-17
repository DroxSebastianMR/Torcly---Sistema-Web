import { describe, it, expect } from 'vitest'
import { hasPermission } from './permissions'
describe('Permisos por módulo', () => {
  it('deniega permisos ausentes y no confunde módulos', () => {
    expect(hasPermission([], 'users:read')).toBe(false)
    expect(hasPermission(['products:read'], 'users:read')).toBe(false)
  })
  it('permite el permiso explícito', () => {
    expect(hasPermission(['users:read'], 'users:read')).toBe(true)
  })
})
