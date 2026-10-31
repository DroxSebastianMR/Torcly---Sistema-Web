const STOP_WORDS = new Set([
  'DE',
  'DEL',
  'EL',
  'LA',
  'LAS',
  'LOS',
  'Y',
  'PARA',
  'POR',
  'CON',
  'SIN',
  'UN',
  'UNA',
  'PRODUCTO',
  'SERVICIO',
])

export const SUGGESTED_CATALOG_CODE_LENGTH = 12

function tokens(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .match(/[A-Z0-9]+/g)
      ?.filter((token) => !STOP_WORDS.has(token)) ?? []
  )
}

function crop(parts: string[]) {
  return parts
    .filter(Boolean)
    .join('-')
    .slice(0, SUGGESTED_CATALOG_CODE_LENGTH)
    .replace(/-+$/g, '')
}

function modelFromName(nameTokens: string[]) {
  const firstNumericIndex = nameTokens.findIndex((token) => /\d/.test(token))
  if (firstNumericIndex < 0) return ''

  const modelTokens = nameTokens.slice(firstNumericIndex)
  const previous = nameTokens[firstNumericIndex - 1]
  if (previous && previous.length <= 3 && !/\d/.test(previous)) {
    modelTokens.unshift(previous)
  }
  return modelTokens.join('')
}

export function sanitizeCatalogCodeInput(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^A-Z0-9._-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[._-]+/g, '')
    .slice(0, 40)
}

export function normalizeCatalogCode(value: string) {
  return sanitizeCatalogCodeInput(value).replace(/[._-]+$/g, '')
}

export function suggestProductCode(name: string, brandName?: string | null) {
  const nameTokens = tokens(name)
  if (!nameTokens.length) return ''

  const brand = tokens(brandName ?? '')[0]?.slice(0, 5) ?? ''
  const model = modelFromName(nameTokens)
  if (brand && model) return crop([brand, model])
  if (brand) return crop([brand, nameTokens[0].slice(0, 3)])
  if (model) return crop([nameTokens[0].slice(0, 3), model])

  return crop(nameTokens.slice(0, 3).map((token) => token.slice(0, 3)))
}

export function suggestServiceCode(name: string) {
  const nameTokens = tokens(name)
  if (!nameTokens.length) return ''
  return crop([
    'SERV',
    ...nameTokens.slice(0, 2).map((token) => token.slice(0, 3)),
  ])
}

export function appendCatalogCodeSequence(code: string, sequence: number) {
  if (!code || sequence <= 1) return code
  const suffix = `-${sequence}`
  const base = code
    .slice(0, SUGGESTED_CATALOG_CODE_LENGTH - suffix.length)
    .replace(/[._-]+$/g, '')
  return `${base}${suffix}`
}
