const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

export function normalizeRoutePath(rawPath: string): string {
  return rawPath
    .replace(UUID_PATTERN, ':uuid')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
}
