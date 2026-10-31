import 'dotenv/config'
import { Pool, type PoolClient } from 'pg'

const confirmation = 'DELETE_ALL_TORCLY_OPERATIONAL_DATA'

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

const codeSequences = [
  'sales_code_seq',
  'appointments_code_seq',
  'work_orders_code_seq',
  'payments_code_seq',
  'replenishment_runs_code_seq',
  'purchases_code_seq',
  'technicians_code_seq',
  'cash_sessions_code_seq',
] as const

const preservedTables = [
  'users',
  'roles',
  'permissions',
  'user_roles',
  'role_permissions',
] as const

function requireProductionUrl() {
  const productionUrl = process.env.PRODUCTION_DIRECT_URL
  if (!productionUrl) throw new Error('PRODUCTION_DIRECT_URL no está configurada.')
  if (productionUrl === process.env.DIRECT_URL) {
    throw new Error('La URL productiva no puede coincidir con DIRECT_URL.')
  }
  if (process.env.CONFIRM_PRODUCTION_RESET !== confirmation) {
    throw new Error(`Define CONFIRM_PRODUCTION_RESET=${confirmation}.`)
  }
  return productionUrl
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

async function countTables(
  client: PoolClient,
  tables: readonly string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const table of tables) {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.${quoteIdentifier(table)}`,
    )
    counts[table] = Number(result.rows[0]?.count ?? 0)
  }
  return counts
}

const pool = new Pool({
  connectionString: requireProductionUrl(),
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 5_000,
})
const client = await pool.connect()

try {
  await client.query('BEGIN')
  await client.query("SET LOCAL lock_timeout = '10s'")
  await client.query("SET LOCAL statement_timeout = '2min'")

  const identity = await client.query<{ user_name: string }>(
    'SELECT current_user AS user_name',
  )
  if (identity.rows[0]?.user_name !== 'postgres') {
    throw new Error('La limpieza requiere el rol administrativo postgres.')
  }

  const preservedBefore = await countTables(client, preservedTables)
  const operationalBefore = await countTables(client, operationalTables)

  const tableList = operationalTables
    .map((table) => `public.${quoteIdentifier(table)}`)
    .join(', ')
  await client.query(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
  )

  for (const sequence of codeSequences) {
    await client.query(
      `ALTER SEQUENCE public.${quoteIdentifier(sequence)} RESTART WITH 1`,
    )
  }

  const preservedAfter = await countTables(client, preservedTables)
  const operationalAfter = await countTables(client, operationalTables)
  if (JSON.stringify(preservedBefore) !== JSON.stringify(preservedAfter)) {
    throw new Error('Cambió una tabla preservada; se revierte la limpieza.')
  }
  const remaining = Object.entries(operationalAfter).filter(
    ([, count]) => count !== 0,
  )
  if (remaining.length > 0) {
    throw new Error('Persisten filas operativas; se revierte la limpieza.')
  }

  await client.query('COMMIT')
  console.info(
    JSON.stringify(
      {
        preserved: preservedAfter,
        deletedOperationalRows: Object.values(operationalBefore).reduce(
          (sum, count) => sum + count,
          0,
        ),
        remainingOperationalRows: 0,
        sequencesRestarted: codeSequences.length,
      },
      null,
      2,
    ),
  )
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
