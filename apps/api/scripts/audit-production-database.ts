import 'dotenv/config'
import { Pool } from 'pg'

const operationalTables = [
  'assistant_messages',
  'assistant_conversations',
  'auth_sessions',
  'audit_logs',
  'notifications',
  'password_reset_tokens',
  'maintenance_windows',
  'work_order_consumptions',
  'work_order_activities',
  'work_order_lines',
  'work_orders',
  'appointments',
  'payments',
  'cash_sessions',
  'sale_lines',
  'sales',
  'replenishment_recommendations',
  'replenishment_runs',
  'purchase_lines',
  'purchases',
  'suppliers',
  'inventory_movements',
  'products',
  'services',
  'technicians',
  'vehicles',
  'customers',
  'product_categories',
  'product_brands',
  'product_units',
] as const

function requireProductionUrl() {
  const productionUrl = process.env.PRODUCTION_DIRECT_URL
  if (!productionUrl) throw new Error('PRODUCTION_DIRECT_URL no está configurada.')
  if (productionUrl === process.env.DIRECT_URL) {
    throw new Error('La URL productiva no puede coincidir con DIRECT_URL.')
  }
  return productionUrl
}

function requireProductionRuntimeUrl() {
  const productionUrl = process.env.PRODUCTION_DATABASE_URL
  if (!productionUrl) {
    throw new Error('PRODUCTION_DATABASE_URL no está configurada.')
  }
  if (productionUrl === process.env.DATABASE_URL) {
    throw new Error('La URL productiva no puede coincidir con DATABASE_URL.')
  }
  return productionUrl
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

const pool = new Pool({
  connectionString: requireProductionUrl(),
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 5_000,
})
const runtimePool = new Pool({
  connectionString: requireProductionRuntimeUrl(),
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 5_000,
})

try {
  const identity = await pool.query<{
    database: string
    user_name: string
    server_address: string | null
  }>(`
    SELECT
      current_database() AS database,
      current_user AS user_name,
      inet_server_addr()::text AS server_address
  `)

  const counts: Array<{ table: string; count: number }> = []
  for (const table of operationalTables) {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.${quoteIdentifier(table)}`,
    )
    counts.push({ table, count: Number(result.rows[0]?.count ?? 0) })
  }

  const preserved = await pool.query<{
    users: string
    roles: string
    permissions: string
    user_roles: string
    role_permissions: string
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM public.users) AS users,
      (SELECT COUNT(*)::text FROM public.roles) AS roles,
      (SELECT COUNT(*)::text FROM public.permissions) AS permissions,
      (SELECT COUNT(*)::text FROM public.user_roles) AS user_roles,
      (SELECT COUNT(*)::text FROM public.role_permissions) AS role_permissions
  `)

  const rls = await pool.query<{
    table_name: string
    enabled: boolean
    forced: boolean
  }>(`
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS enabled,
      c.relforcerowsecurity AS forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname <> '_prisma_migrations'
    ORDER BY c.relname
  `)

  const migrations = await pool.query<{ pending: string; applied: string }>(`
    SELECT
      COUNT(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL)::text AS pending,
      COUNT(*) FILTER (WHERE finished_at IS NOT NULL)::text AS applied
    FROM public._prisma_migrations
  `)

  const runtimeAccess = await runtimePool.query<{
    user_name: string
    users: string
    products: string
  }>(`
    SELECT
      current_user AS user_name,
      (SELECT COUNT(*)::text FROM public.users) AS users,
      (SELECT COUNT(*)::text FROM public.products) AS products
  `)

  console.info(
    JSON.stringify(
      {
        target: identity.rows[0],
        preserved: preserved.rows[0],
        operational: counts.filter((entry) => entry.count > 0),
        operationalTotal: counts.reduce((sum, entry) => sum + entry.count, 0),
        rls: {
          enabled: rls.rows.filter((table) => table.enabled).length,
          disabled: rls.rows.filter((table) => !table.enabled).map((table) => table.table_name),
          forced: rls.rows.filter((table) => table.forced).map((table) => table.table_name),
        },
        migrations: migrations.rows[0],
        runtimeAccess: runtimeAccess.rows[0],
      },
      null,
      2,
    ),
  )
} finally {
  await Promise.all([pool.end(), runtimePool.end()])
}
