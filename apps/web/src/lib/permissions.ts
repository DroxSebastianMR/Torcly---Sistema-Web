export const modules = [
  'dashboard',
  'products',
  'barcodes',
  'inventory',
  'purchases',
  'sales',
  'customers',
  'cash',
  'users',
  'notifications',
  'profile',
  'reports',
] as const
export type Module = (typeof modules)[number]
export type Permission = `${Module}:read`
export function hasPermission(
  permissions: readonly string[],
  required: Permission,
) {
  return permissions.includes(required)
}
