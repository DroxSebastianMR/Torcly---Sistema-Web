import 'dotenv/config'
import { Pool } from 'pg'

function requireProductionUrl() {
  const productionUrl = process.env.PRODUCTION_DIRECT_URL
  if (!productionUrl) {
    throw new Error('PRODUCTION_DIRECT_URL no está configurada.')
  }
  return productionUrl
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

  console.info('Configurando organización "Grupo Mecatronic" en producción...')

  // 1. Actualizar o crear la organización Grupo Mecatronic
  const orgResult = await client.query<{
    id: string
    code: string
    name: string
  }>(`SELECT id, code, name FROM organizations ORDER BY created_at ASC LIMIT 1`)

  let organizationId: string

  if (orgResult.rows.length === 0) {
    const insertOrg = await client.query<{
      id: string
      code: string
      name: string
    }>(`
      INSERT INTO organizations (code, name, active, created_at, updated_at)
      VALUES ('grupo-mecatronic', 'Grupo Mecatronic', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, code, name;
    `)
    organizationId = insertOrg.rows[0].id
    console.info(`Organización creada: Grupo Mecatronic (${organizationId})`)
  } else {
    organizationId = orgResult.rows[0].id
    await client.query(
      `
      UPDATE organizations
      SET code = 'grupo-mecatronic',
          name = 'Grupo Mecatronic',
          active = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
      `,
      [organizationId],
    )
    console.info(
      `Organización actualizada a Grupo Mecatronic (${organizationId})`,
    )
  }

  // 2. Obtener usuarios Jhon e Ysabel
  const jhon = await client.query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE email = 'admin.jhon@torcly.com'`,
  )
  const ysabel = await client.query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE email = 'admin.ysabel@torcly.com'`,
  )

  const adminRole = await client.query<{ id: string }>(
    `SELECT id FROM roles WHERE code = 'administrator' LIMIT 1`,
  )

  if (!adminRole.rows[0]) {
    throw new Error('No se encontró el rol administrator en la base de datos.')
  }
  const roleId = adminRole.rows[0].id

  // 3. Asegurar membresía de Jhon e Ysabel en Grupo Mecatronic
  for (const user of [jhon.rows[0], ysabel.rows[0]].filter(Boolean)) {
    await client.query(
      `
      INSERT INTO organization_memberships (organization_id, user_id, role_id, active, joined_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
      ON CONFLICT (organization_id, user_id)
      DO UPDATE SET role_id = EXCLUDED.role_id, active = true;
      `,
      [organizationId, user.id, roleId],
    )
    console.info(
      `Membresía asegurada para: ${user.email} con rol Dueño del taller`,
    )
  }

  // 4. Eliminar la cuenta admin@torcly.com
  const adminUser = await client.query<{ id: string }>(
    `SELECT id FROM users WHERE email = 'admin@torcly.com'`,
  )

  if (adminUser.rows[0]) {
    const adminId = adminUser.rows[0].id
    console.info(`Depurando cuenta admin@torcly.com (${adminId})...`)

    await client.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [
      adminId,
    ])
    await client.query(`DELETE FROM audit_logs WHERE user_id = $1`, [adminId])
    await client.query(
      `DELETE FROM organization_memberships WHERE user_id = $1`,
      [adminId],
    )
    await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [adminId])
    await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [
      adminId,
    ])
    await client.query(`DELETE FROM notifications WHERE user_id = $1`, [
      adminId,
    ])
    await client.query(`DELETE FROM users WHERE id = $1`, [adminId])

    console.info('✅ Cuenta admin@torcly.com eliminada correctamente.')
  } else {
    console.info(
      'Cuenta admin@torcly.com no encontrada en producción (ya estaba eliminada).',
    )
  }

  await client.query('COMMIT')
  console.info('\nTransacción completada exitosamente.')

  // 5. Verificación final de lo que quedó en producción
  const finalUsers = await client.query(`
    SELECT id, email, username, display_name, is_platform_admin, active
    FROM users
    ORDER BY created_at ASC;
  `)
  const finalOrgs = await client.query(`
    SELECT id, code, name, active FROM organizations;
  `)
  const finalMemberships = await client.query(`
    SELECT o.name AS organization, u.display_name AS usuario, u.email, r.name AS rol
    FROM organization_memberships om
    JOIN organizations o ON o.id = om.organization_id
    JOIN users u ON u.id = om.user_id
    JOIN roles r ON r.id = om.role_id;
  `)

  console.info('\n--- ESTADO FINAL EN PRODUCCIÓN ---')
  console.info('Organizaciones:', finalOrgs.rows)
  console.info('Usuarios:', finalUsers.rows)
  console.info('Membresías activas:', finalMemberships.rows)
} catch (error) {
  await client.query('ROLLBACK')
  console.error('❌ Error durante la configuración:', error)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
