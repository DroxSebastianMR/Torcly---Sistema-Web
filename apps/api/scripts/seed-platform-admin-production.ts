import 'dotenv/config'
import { Pool } from 'pg'
import { hashPassword } from '../src/modules/auth/password.js'

function requireProductionUrl() {
  const productionUrl = process.env.PRODUCTION_DIRECT_URL
  if (!productionUrl) {
    throw new Error('PRODUCTION_DIRECT_URL no está configurada.')
  }
  return productionUrl
}

const email = process.env.SEED_PLATFORM_ADMIN_EMAIL
const username = process.env.SEED_PLATFORM_ADMIN_USERNAME
const name = process.env.SEED_PLATFORM_ADMIN_NAME
const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD

if (!email || !username || !name || !password) {
  throw new Error('Faltan variables SEED_PLATFORM_ADMIN_* en el archivo .env')
}

const pool = new Pool({
  connectionString: requireProductionUrl(),
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 5_000,
})

try {
  console.info(
    `Sembrando administrador de plataforma en producción (${email})...`,
  )

  const passwordHash = await hashPassword(password)
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim().toLowerCase()

  const result = await pool.query<{
    id: string
    email: string
    username: string
    display_name: string
    is_platform_admin: boolean
  }>(
    `
    INSERT INTO "users" (
      "id",
      "email",
      "username",
      "display_name",
      "password_hash",
      "active",
      "is_platform_admin",
      "failed_login_attempts",
      "locked_until",
      "created_at",
      "updated_at"
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      $3,
      $4,
      true,
      true,
      0,
      null,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("email") DO UPDATE SET
      "username" = EXCLUDED."username",
      "display_name" = EXCLUDED."display_name",
      "password_hash" = EXCLUDED."password_hash",
      "active" = true,
      "is_platform_admin" = true,
      "failed_login_attempts" = 0,
      "locked_until" = null,
      "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id", "email", "username", "display_name", "is_platform_admin";
    `,
    [normalizedEmail, normalizedUsername, name, passwordHash],
  )

  console.info(
    '✅ Administrador de plataforma sembrado con éxito en producción:',
  )
  console.info(JSON.stringify(result.rows[0], null, 2))
} catch (error) {
  console.error(
    '❌ Error sembrando administrador de plataforma en producción:',
    error,
  )
  process.exit(1)
} finally {
  await pool.end()
}
