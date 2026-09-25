import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { createPostgresPoolConfig } from '../src/infrastructure/database/postgres-pool.config.js'
import { hashPassword } from '../src/modules/auth/password.js'

const seedEnvSchema = z.object({
  DIRECT_URL: z.url().startsWith('postgresql://'),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_USERNAME: z.string().min(3).max(50),
  SEED_ADMIN_NAME: z.string().min(2).max(120),
  SEED_ADMIN_PASSWORD: z.string().min(12),
})

const defaultPermissionCodes = [
  'dashboard:read',
  'products:read',
  'products:write',
  'barcodes:read',
  'inventory:read',
  'inventory:write',
  'services:read',
  'services:write',
  'purchases:read',
  'sales:read',
  'sales:write',
  'customers:read',
  'customers:write',
  'vehicles:read',
  'vehicles:write',
  'appointments:read',
  'appointments:write',
  'cash:read',
  'users:read',
  'users:write',
  'notifications:read',
  'profile:read',
  'reports:read',
] as const

export interface SeedInput {
  email: string
  username: string
  name: string
  password: string
  roleCode?: string
  permissionCodes?: readonly string[]
}

export async function seedDatabase(database: PrismaClient, input: SeedInput) {
  const permissionCodes = input.permissionCodes ?? defaultPermissionCodes
  const roleCode = input.roleCode ?? 'administrator'
  const permissions = []
  for (const code of permissionCodes) {
    permissions.push(
      await database.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: `Permiso ${code}` },
      }),
    )
  }

  const administratorRole = await database.role.upsert({
    where: { code: roleCode },
    update: { name: 'Administrador', active: true },
    create: { code: roleCode, name: 'Administrador' },
  })

  await database.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: administratorRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  })

  const passwordHash = await hashPassword(input.password)
  const administrator = await database.user.upsert({
    where: { email: input.email.toLowerCase() },
    update: {
      username: input.username.toLowerCase(),
      displayName: input.name,
      passwordHash,
      active: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      displayName: input.name,
      passwordHash,
    },
  })

  await database.userRole.upsert({
    where: {
      userId_roleId: {
        userId: administrator.id,
        roleId: administratorRole.id,
      },
    },
    update: {},
    create: { userId: administrator.id, roleId: administratorRole.id },
  })

  console.info(`Seed completado para ${administrator.email}.`)
  return administrator
}

async function runSeed() {
  const seedEnv = seedEnvSchema.parse(process.env)
  const database = new PrismaClient({
    adapter: new PrismaPg(createPostgresPoolConfig(seedEnv.DIRECT_URL, 1)),
  })

  try {
    await seedDatabase(database, {
      email: seedEnv.SEED_ADMIN_EMAIL,
      username: seedEnv.SEED_ADMIN_USERNAME,
      name: seedEnv.SEED_ADMIN_NAME,
      password: seedEnv.SEED_ADMIN_PASSWORD,
    })
  } finally {
    await database.$disconnect()
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void runSeed().catch((error: unknown) => {
    console.error('No se pudo ejecutar el seed de autenticación.')
    if (process.env.NODE_ENV === 'development') console.error(error)
    process.exitCode = 1
  })
}
