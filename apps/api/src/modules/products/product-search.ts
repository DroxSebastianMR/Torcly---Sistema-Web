import { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { ProductFilters } from './products.types.js'

type Filters = Pick<
  ProductFilters,
  'page' | 'pageSize' | 'categoryId' | 'search'
> & {
  status?: ProductFilters['status']
}

// Normalize both operands in PostgreSQL, before pagination, including existing catalog rows.
function compact(field: Prisma.Sql) {
  const separators = '[[:space:][:punct:]\u0300-\u036f·–—]+'
  return Prisma.sql`regexp_replace(lower(normalize(${field}, NFD)), ${separators}, '', 'g')`
}

export async function searchProductPage(
  filters: Filters,
  organizationId: string,
) {
  const search = filters.search?.trim()
  if (!search) return undefined
  const fields = [
    Prisma.sql`p.name`,
    Prisma.sql`p.code`,
    Prisma.sql`p.barcode`,
    Prisma.sql`c.name`,
  ]
  const terms = fields.map(
    (field) =>
      Prisma.sql`CASE WHEN needle.key = '' THEN strpos(${field}, ${search}) > 0 ELSE strpos(${compact(field)}, needle.key) > 0 END`,
  )
  const [page] = await databaseService.client.$queryRaw<
    Array<{ ids: string[]; total: number }>
  >`
    WITH needle AS (SELECT ${compact(Prisma.sql`${search}::text`)} AS key),
    matches AS (
      SELECT p.id, p.name, p.active
      FROM products p
      JOIN product_categories c ON c.id = p.category_id AND c.organization_id = p.organization_id
      CROSS JOIN needle
      WHERE p.organization_id = ${organizationId}::uuid
        ${filters.categoryId ? Prisma.sql`AND p.category_id = ${filters.categoryId}::uuid` : Prisma.empty}
        ${filters.status && filters.status !== 'all' ? Prisma.sql`AND p.active = ${filters.status === 'active'}` : Prisma.empty}
        AND (${Prisma.join(terms, ' OR ')})
    )
    SELECT ARRAY(SELECT id::text FROM matches ORDER BY active DESC, name, id
                 LIMIT ${filters.pageSize} OFFSET ${(filters.page - 1) * filters.pageSize}) AS ids,
           (SELECT count(*)::int FROM matches) AS total
  `
  return page
}
