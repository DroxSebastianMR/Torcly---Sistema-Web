import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { ProductFilters, ProductInput } from './products.types.js'

const productRelations = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, symbol: true } },
  inventoryMovements: {
    where: { status: 'CONFIRMED' as const },
    select: { type: true, quantity: true },
  },
} satisfies Prisma.ProductInclude

const productSelect = { include: productRelations } as const

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const search = filters.search?.trim()

  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status === 'active'
      ? { active: true }
      : filters.status === 'inactive'
        ? { active: false }
        : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }
}

export const productsRepository = {
  async list(filters: ProductFilters) {
    const where = buildWhere(filters)
    const [items, total] = await databaseService.transaction(
      async (transaction) =>
        Promise.all([
          transaction.product.findMany({
            ...productSelect,
            where,
            orderBy: [{ active: 'desc' }, { name: 'asc' }],
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
          }),
          transaction.product.count({ where }),
        ]),
    )

    return { items, total }
  },

  findById(id: string) {
    return databaseService.client.product.findUnique({
      ...productSelect,
      where: { id },
    })
  },

  create(input: ProductInput) {
    return databaseService.client.product.create({
      ...productSelect,
      data: input,
    })
  },

  update(id: string, input: ProductInput) {
    return databaseService.client.product.update({
      ...productSelect,
      where: { id },
      data: input,
    })
  },

  updateStatus(id: string, active: boolean) {
    return databaseService.client.product.update({
      ...productSelect,
      where: { id },
      data: { active },
    })
  },

  async getOptions() {
    const [categories, brands, units] = await Promise.all([
      databaseService.client.productCategory.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      databaseService.client.productBrand.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      databaseService.client.productUnit.findMany({
        where: { active: true },
        select: { id: true, name: true, symbol: true },
        orderBy: { name: 'asc' },
      }),
    ])

    return { categories, brands, units }
  },

  createCategory(name: string) {
    return databaseService.client.productCategory.create({
      data: { name },
      select: { id: true, name: true },
    })
  },

  createBrand(name: string) {
    return databaseService.client.productBrand.create({
      data: { name },
      select: { id: true, name: true },
    })
  },

  createUnit(name: string, symbol: string) {
    return databaseService.client.productUnit.create({
      data: { name, symbol },
      select: { id: true, name: true, symbol: true },
    })
  },
}

export type ProductRecord = NonNullable<
  Awaited<ReturnType<typeof productsRepository.findById>>
>
