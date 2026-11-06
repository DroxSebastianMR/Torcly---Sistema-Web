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

  // Obtener rol workshop_manager
  const roleRes = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM roles WHERE code = 'workshop_manager'`,
  )
  if (!roleRes.rows[0]) {
    throw new Error('No se encontró el rol workshop_manager')
  }
  const managerRoleId = roleRes.rows[0].id

  // Obtener usuaria Ysabel
  const ysabelRes = await client.query<{ id: string }>(
    `SELECT id FROM users WHERE email = 'admin.ysabel@torcly.com'`,
  )
  if (!ysabelRes.rows[0]) {
    throw new Error('No se encontró la usuaria admin.ysabel@torcly.com')
  }
  const ysabelId = ysabelRes.rows[0].id

  // Actualizar membresía en organization_memberships
  await client.query(
    `
    UPDATE organization_memberships
    SET role_id = $1
    WHERE user_id = $2;
    `,
    [managerRoleId, ysabelId],
  )

  // Actualizar rol en user_roles
  await client.query(
    `
    UPDATE user_roles
    SET role_id = $1
    WHERE user_id = $2;
    `,
    [managerRoleId, ysabelId],
  )

  // Invalidar sesiones activas para que recargue permisos limpios
  await client.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [ysabelId])

  await client.query('COMMIT')
  console.info(
    '✅ Rol Administrador del taller asignado exitosamente a Ysabel Quinteros en producción.',
  )

  // Consultar permisos del nuevo rol
  const permRes = await client.query<{ total: string }>(
    `SELECT COUNT(*)::text as total FROM role_permissions WHERE role_id = $1`,
    [managerRoleId],
  )
  console.info(
    `Permisos asignados al rol Administrador del taller: ${permRes.rows[0].total}`,
  )

  // Consultar miembros actuales de Grupo Mecatronic
  const members = await client.query(`
    SELECT o.name as organizacion, u.display_name as usuario, u.email, r.name as rol
    FROM organization_memberships om
    JOIN organizations o ON o.id = om.organization_id
    JOIN users u ON u.id = om.user_id
    JOIN roles r ON r.id = om.role_id;
  `)
  console.info('Membresías actuales en producción:', members.rows)
} catch (error) {
  await client.query('ROLLBACK')
  console.error('❌ Error asignando rol:', error)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
