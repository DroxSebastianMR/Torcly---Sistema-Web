import 'dotenv/config'
import { execSync } from 'node:child_process'

const directUrl = process.env.PRODUCTION_DIRECT_URL
const databaseUrl = process.env.PRODUCTION_DATABASE_URL

if (!directUrl) {
  throw new Error('PRODUCTION_DIRECT_URL no está configurada.')
}

if (!databaseUrl) {
  throw new Error('PRODUCTION_DATABASE_URL no está configurada.')
}

console.info('Iniciando despliegue de migraciones en la base de datos de producción...')

try {
  const output = execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DIRECT_URL: directUrl,
      DATABASE_URL: databaseUrl,
    },
    encoding: 'utf-8',
    stdio: 'pipe',
  })

  console.info(output)
  console.info('✅ Migraciones aplicadas exitosamente en producción.')
} catch (error) {
  console.error('❌ Error aplicando migraciones:')
  if (typeof error === 'object' && error !== null) {
    if ('stdout' in error && error.stdout) console.error(String(error.stdout))
    if ('stderr' in error && error.stderr) console.error(String(error.stderr))
  }
  process.exit(1)
}
