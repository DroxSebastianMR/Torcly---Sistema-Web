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
    SEED_ORGANIZATION_CODE: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9-]+$/)
      .default('torcly-principal'),
    SEED_ORGANIZATION_NAME: z.string().min(2).max(120).default('Torcly'),
    SEED_PLATFORM_ADMIN_EMAIL: z.email().optional(),
    SEED_PLATFORM_ADMIN_USERNAME: z.string().min(3).max(50).optional(),
    SEED_PLATFORM_ADMIN_NAME: z.string().min(2).max(120).optional(),
    SEED_PLATFORM_ADMIN_PASSWORD: z.string().min(12).optional(),
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

    const platformFields = [
      'SEED_PLATFORM_ADMIN_EMAIL',
      'SEED_PLATFORM_ADMIN_USERNAME',
      'SEED_PLATFORM_ADMIN_NAME',
      'SEED_PLATFORM_ADMIN_PASSWORD',
    ] as const
    const hasPlatformField = platformFields.some((field) =>
      Boolean(value[field]),
    )
    if (hasPlatformField) {
      for (const field of platformFields) {
        if (!value[field]) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message: `${field} es obligatorio si se crea el administrador de plataforma.`,
          })
        }
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
  organization?: {
    code: string
    name: string
  }
  platformAdministrator?: SeedAccount
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
    update: { name: 'Dueño del taller', active: true },
    create: { code: roleCode, name: 'Dueño del taller' },
  })

  await database.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: administratorRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  })

  const workshopManagerRole = await database.role.upsert({
    where: { code: 'workshop_manager' },
    update: { name: 'Administrador del taller', active: true },
    create: { code: 'workshop_manager', name: 'Administrador del taller' },
  })

  const managerPermissions = permissions.filter(
    (permission) =>
      permission.code !== 'users:read' && permission.code !== 'users:write',
  )

  await database.rolePermission.createMany({
    data: managerPermissions.map((permission) => ({
      roleId: workshopManagerRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  })

  const organizationInput = input.organization ?? {
    code: 'torcly-principal',
    name: 'Torcly',
  }
  const organization = await database.organization.upsert({
    where: { code: organizationInput.code.toLowerCase() },
    update: { name: organizationInput.name, active: true },
    create: {
      code: organizationInput.code.toLowerCase(),
      name: organizationInput.name,
    },
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

    await database.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: { roleId: administratorRole.id, active: true },
      create: {
        organizationId: organization.id,
        userId: user.id,
        roleId: administratorRole.id,
      },
    })

    seededAccounts.push(user)
  }

  const administrator = seededAccounts[0]

  if (input.platformAdministrator) {
    const passwordHash = await hashPassword(
      input.platformAdministrator.password,
    )
    await database.user.upsert({
      where: { email: input.platformAdministrator.email.toLowerCase() },
      update: {
        username: input.platformAdministrator.username.toLowerCase(),
        displayName: input.platformAdministrator.name,
        passwordHash,
        active: true,
        isPlatformAdmin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: input.platformAdministrator.email.toLowerCase(),
        username: input.platformAdministrator.username.toLowerCase(),
        displayName: input.platformAdministrator.name,
        passwordHash,
        isPlatformAdmin: true,
      },
    })
  }

  if (input.includeDemoTechnicians ?? true) {
    for (const technician of demoTechnicians) {
      await database.technician.upsert({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: technician.code,
          },
        },
        update: { ...technician, active: true, updatedBy: administrator.id },
        create: {
          ...technician,
          organizationId: organization.id,
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

  // Seeding de planes comerciales SaaS y suscripción de organización
  const plansData = [
    {
      code: 'STARTER',
      name: 'Plan Inicial',
      description:
        'Para talleres independientes y mecánicos que inician su digitalización.',
      priceMonthly: 79.0,
      priceYearly: 790.0,
      currency: 'PEN',
      maxMembers: 3,
      maxTechnicians: 5,
      maxProducts: 250,
      features: [
        'Hasta 3 miembros en el taller',
        'Hasta 5 técnicos en catálogo',
        '250 productos en inventario',
        'Gestión de citas y órdenes de trabajo',
        'Cobros y arqueo de caja básicos',
      ],
      active: true,
      isPublic: true,
    },
    {
      code: 'PRO',
      name: 'Plan Profesional',
      description:
        'Para talleres en crecimiento con equipo técnico, recepción y almacén.',
      priceMonthly: 149.0,
      priceYearly: 1490.0,
      currency: 'PEN',
      maxMembers: 10,
      maxTechnicians: 15,
      maxProducts: 2500,
      features: [
        'Hasta 10 miembros en el taller',
        'Hasta 15 técnicos en catálogo',
        '2,500 productos en inventario',
        'Asistente IA conversacional',
        'Múltiples sesiones de caja',
        'Analítica y reportes avanzados',
        'Reabastecimiento predictivo',
      ],
      active: true,
      isPublic: true,
    },
    {
      code: 'ENTERPRISE',
      name: 'Plan Corporativo',
      description:
        'Para cadenas de talleres automotrices con operaciones de alto volumen.',
      priceMonthly: 299.0,
      priceYearly: 2990.0,
      currency: 'PEN',
      maxMembers: 50,
      maxTechnicians: 50,
      maxProducts: 20000,
      features: [
        'Hasta 50 miembros en el taller',
        'Hasta 50 técnicos en catálogo',
        '20,000 productos en inventario',
        'Todas las funcionalidades Pro',
        'Soporte prioritario 24/7',
        'Auditoría y trazabilidad completa',
      ],
      active: true,
      isPublic: true,
    },
  ]

  const seededPlans: Record<string, string> = {}
  for (const plan of plansData) {
    const upsertedPlan = await database.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        maxMembers: plan.maxMembers,
        maxTechnicians: plan.maxTechnicians,
        maxProducts: plan.maxProducts,
        features: plan.features,
        active: plan.active,
        isPublic: plan.isPublic,
      },
      create: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        maxMembers: plan.maxMembers,
        maxTechnicians: plan.maxTechnicians,
        maxProducts: plan.maxProducts,
        features: plan.features,
        active: plan.active,
        isPublic: plan.isPublic,
      },
    })
    seededPlans[plan.code] = upsertedPlan.id
  }

  // Asignar suscripción a la organización semilla (ENTERPRISE)
  const enterprisePlanId = seededPlans['ENTERPRISE']
  if (enterprisePlanId) {
    await database.organizationSubscription.upsert({
      where: { organizationId: organization.id },
      update: {
        planId: enterprisePlanId,
        status: 'ACTIVE',
        billingCycle: 'ANNUAL',
        renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizationId: organization.id,
        planId: enterprisePlanId,
        status: 'ACTIVE',
        billingCycle: 'ANNUAL',
        startsAt: new Date(),
        renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        notes: 'Suscripción corporativa inicial.',
      },
    })
  }

  // Garantizar que toda organización existente tenga suscripción activa
  const allOrganizations = await database.organization.findMany({
    where: { subscription: null },
  })
  const proPlanId = seededPlans['PRO']
  if (proPlanId) {
    for (const org of allOrganizations) {
      await database.organizationSubscription.create({
        data: {
          organizationId: org.id,
          planId: proPlanId,
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          startsAt: new Date(),
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: 'Suscripción asignada por migración de Sprint 28.',
        },
      })
    }
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
      organization: {
        code: seedEnv.SEED_ORGANIZATION_CODE,
        name: seedEnv.SEED_ORGANIZATION_NAME,
      },
      platformAdministrator: seedEnv.SEED_PLATFORM_ADMIN_EMAIL
        ? {
            email: seedEnv.SEED_PLATFORM_ADMIN_EMAIL,
            username: seedEnv.SEED_PLATFORM_ADMIN_USERNAME!,
            name: seedEnv.SEED_PLATFORM_ADMIN_NAME!,
            password: seedEnv.SEED_PLATFORM_ADMIN_PASSWORD!,
          }
        : undefined,
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
