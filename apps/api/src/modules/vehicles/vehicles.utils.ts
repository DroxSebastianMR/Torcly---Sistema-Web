export const VEHICLE_YEAR_MIN = 1950
export const VEHICLE_YEAR_MAX = new Date().getFullYear() + 1

export const CANONICAL_PLATE_PATTERN = /^[A-Z0-9]{5,8}$/

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, '').trim()
}
