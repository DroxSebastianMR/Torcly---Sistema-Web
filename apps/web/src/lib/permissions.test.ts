import { describe, it, expect } from 'vitest'
import { hasPermission, modules } from './permissions'
describe('Permisos por módulo', () => {
  it('deniega permisos ausentes y no confunde módulos', () => {
    expect(hasPermission([], 'users:read')).toBe(false)
    expect(hasPermission(['products:read'], 'users:read')).toBe(false)
  })
  it('permite el permiso explícito', () => {
    expect(hasPermission(['users:read'], 'users:read')).toBe(true)
  })
  it('no incluye el módulo retirado barcodes', () => {
    expect(modules).not.toContain('barcodes')
    expect(modules).toContain('profile')
    expect(modules).toContain('notifications')
  })
})
