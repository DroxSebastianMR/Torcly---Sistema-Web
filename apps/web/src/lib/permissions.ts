export const modules = [
  'dashboard',
  'products',
  'barcodes',
  'inventory',
  'services',
  'purchases',
  'sales',
  'appointments',
  'customers',
  'vehicles',
  'cash',
  'users',
  'notifications',
  'profile',
  'reports',
] as const
export type Module = (typeof modules)[number]
export type PermissionAction = 'read' | 'write'
export type Permission = `${Module}:${PermissionAction}`
export function hasPermission(
  permissions: readonly string[],
  required: Permission,
) {
  return permissions.includes(required)
}
