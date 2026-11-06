import 'dotenv/config'
import { Pool } from 'pg'
import * as fs from 'node:fs'
import * as path from 'node:path'

function requireProductionUrl() {
  const productionUrl = process.env.PRODUCTION_DIRECT_URL
  if (!productionUrl) {
    throw new Error('PRODUCTION_DIRECT_URL no está configurada.')
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

try {
  const tableResult = await pool.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `)

  const tables = tableResult.rows.map((row) => row.table_name)
  console.info(
    `Encontradas ${tables.length} tablas en producción para respaldar...`,
  )

  const backupData: Record<string, unknown[]> = {}
  let totalRows = 0

  for (const table of tables) {
    const rows = await pool.query(
      `SELECT * FROM public.${quoteIdentifier(table)}`,
    )
    backupData[table] = rows.rows
    totalRows += rows.rows.length
    if (rows.rows.length > 0) {
      console.info(`- ${table}: ${rows.rows.length} registros`)
    }
  }

  const outputDir = path.resolve(process.cwd(), '..', '..', 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = path.join(outputDir, `production-backup-${timestamp}.json`)

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalTables: tables.length,
        totalRows,
        data: backupData,
      },
      null,
      2,
    ),
    'utf-8',
  )

  console.info(`\n✅ Respaldo completado con éxito: ${filePath}`)
  console.info(`Total de registros respaldados: ${totalRows}`)
} finally {
  await pool.end()
}
