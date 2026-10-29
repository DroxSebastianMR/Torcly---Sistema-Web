export const QUANTITY_MAX_DECIMALS_MESSAGE =
  'La cantidad admite hasta tres decimales.'

const DECIMAL_SCALE = 1000
const DECIMAL_TOLERANCE = 1e-9

export function hasAtMostThreeDecimals(value: number) {
  if (!Number.isFinite(value)) return false
  const scaled = value * DECIMAL_SCALE
  return Math.abs(scaled - Math.round(scaled)) < DECIMAL_TOLERANCE
}
