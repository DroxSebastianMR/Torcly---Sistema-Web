import 'dotenv/config'
import { pathToFileURL } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { createPostgresPoolConfig } from '../src/infrastructure/database/postgres-pool.config.js'
import { hashPassword } from '../src/modules/auth/password.js'

const seedEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    DIRECT_URL: z.url().startsWith('postgresql://'),
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_USERNAME: z.string().min(3).max(50),
    SEED_ADMIN_NAME: z.string().min(2).max(120),
    SEED_ADMIN_PASSWORD: z.string().min(12),
    SEED_OWNER_EMAIL: z.email().optional(),
    SEED_OWNER_USERNAME: z.string().min(3).max(50).optional(),
    SEED_OWNER_NAME: z.string().min(2).max(120).optional(),
    SEED_OWNER_PASSWORD: z.string().min(12).optional(),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== 'production') return

    const ownerFields = [
      'SEED_OWNER_EMAIL',
      'SEED_OWNER_USERNAME',
      'SEED_OWNER_NAME',
      'SEED_OWNER_PASSWORD',
    ] as const

    for (const field of ownerFields) {
      if (!value[field]) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: `${field} es obligatorio para la semilla de producción.`,
        })
      }
    }
  })

const defaultPermissionCodes = [
  'dashboard:read',
  'assistant:read',
  'products:read',
  'products:write',
  'inventory:read',
  'inventory:write',
  'services:read',
  'services:write',
  'purchases:read',
  'purchases:write',
  'sales:read',
  'sales:write',
  'customers:read',
  'customers:write',
  'vehicles:read',
  'vehicles:write',
  'appointments:read',
  'appointments:write',
  'workshop:read',
  'workshop:write',
  'cash:read',
  'cash:write',
  'users:read',
  'users:write',
  'notifications:read',
  'profile:read',
  'reports:read',
  'audit:read',
  'maintenance:read',
  'maintenance:write',
] as const

export interface SeedInput {
  email: string
  username: string
  name: string
  password: string
  roleCode?: string
  permissionCodes?: readonly string[]
  includeDemoTechnicians?: boolean
  additionalAdministrators?: readonly SeedAccount[]
}

export interface SeedAccount {
  email: string
  username: string
  name: string
  password: string
}

const demoTechnicians = [
  {
    code: 'TEC-000001',
    fullName: 'Carlos Mendoza Ramos',
    document: '73124568',
    phone: '987654321',
    email: 'carlos.mendoza@torcly.demo',
    specialties: 'Mantenimiento preventivo y lubricación',
  },
  {
    code: 'TEC-000002',
    fullName: 'Lucía Herrera Flores',
    document: '74235679',
    phone: '986543210',
    email: 'lucia.herrera@torcly.demo',
    specialties: 'Frenos y suspensión',
  },
  {
    code: 'TEC-000003',
    fullName: 'Diego Salazar Peña',
    document: '75346780',
    phone: '985432109',
    email: 'diego.salazar@torcly.demo',
    specialties: 'Diagnóstico eléctrico y electrónico',
  },
  {
    code: 'TEC-000004',
    fullName: 'María Paredes Cruz',
    document: '76457891',
    phone: '984321098',
    email: 'maria.paredes@torcly.demo',
    specialties: 'Motor y transmisión',
  },
]

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

  const accounts: readonly SeedAccount[] = [
    {
      email: input.email,
      username: input.username,
      name: input.name,
      password: input.password,
    },
    ...(input.additionalAdministrators ?? []),
  ]
  const seededAccounts = []

  for (const account of accounts) {
    const passwordHash = await hashPassword(account.password)
    const user = await database.user.upsert({
      where: { email: account.email.toLowerCase() },
      update: {
        username: account.username.toLowerCase(),
        displayName: account.name,
        passwordHash,
        active: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: account.email.toLowerCase(),
        username: account.username.toLowerCase(),
        displayName: account.name,
        passwordHash,
      },
    })

    await database.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: administratorRole.id,
        },
      },
      update: {},
      create: { userId: user.id, roleId: administratorRole.id },
    })

    seededAccounts.push(user)
  }

  const administrator = seededAccounts[0]

  if (input.includeDemoTechnicians ?? true) {
    for (const technician of demoTechnicians) {
      await database.technician.upsert({
        where: { code: technician.code },
        update: { ...technician, active: true, updatedBy: administrator.id },
        create: {
          ...technician,
          createdBy: administrator.id,
          updatedBy: administrator.id,
        },
      })
    }

    // La creación operativa usa la secuencia para generar TEC-000001, etc.
    // El seed avanza la secuencia para no colisionar con sus cuatro registros.
    await database.$executeRawUnsafe(
      `SELECT setval('technicians_code_seq', GREATEST((SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) FROM technicians), 1), true)`,
    )
  }

  console.info(
    `Seed completado para ${seededAccounts.map((account) => account.email).join(', ')}.`,
  )
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
      includeDemoTechnicians: seedEnv.NODE_ENV !== 'production',
      additionalAdministrators: seedEnv.SEED_OWNER_EMAIL
        ? [
            {
              email: seedEnv.SEED_OWNER_EMAIL,
              username: seedEnv.SEED_OWNER_USERNAME!,
              name: seedEnv.SEED_OWNER_NAME!,
              password: seedEnv.SEED_OWNER_PASSWORD!,
            },
          ]
        : [],
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
