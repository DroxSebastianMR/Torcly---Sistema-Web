/** Comparison key only. Keep the original text for display and submission. */
export function searchKey(value: string) {
  return value
    .normalize('NFD')
    .toLocaleLowerCase('es')
    .replace(/[\p{M}\p{P}\p{Z}\p{S}\s]/gu, '')
}
