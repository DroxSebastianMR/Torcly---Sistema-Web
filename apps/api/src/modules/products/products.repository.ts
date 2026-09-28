import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
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

function auditData(
  event: AuditEventType,
  actorId: string,
  identifier: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

type ProductWithRelations = Prisma.ProductGetPayload<typeof productSelect>

function productAuditMetadata(product: ProductWithRelations) {
  return {
    productId: product.id,
    code: product.code,
    name: product.name,
    categoryId: product.categoryId,
    brandId: product.brandId,
    unitId: product.unitId,
    salePrice: Number(product.salePrice),
    minimumStock: Number(product.minimumStock),
    active: product.active,
  }
}

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

  create(input: ProductInput, actorId: string, context: RequestContext) {
    return databaseService.transaction(async (transaction) => {
      const product = await transaction.product.create({
        ...productSelect,
        data: input,
      })
      await transaction.auditLog.create({
        data: auditData(
          'PRODUCT_CREATED',
          actorId,
          product.code,
          context,
          productAuditMetadata(product),
        ),
      })
      return product
    })
  },

  update(
    id: string,
    input: ProductInput,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const product = await transaction.product.update({
        ...productSelect,
        where: { id },
        data: input,
      })
      await transaction.auditLog.create({
        data: auditData(
          'PRODUCT_UPDATED',
          actorId,
          product.code,
          context,
          productAuditMetadata(product),
        ),
      })
      return product
    })
  },

  updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const product = await transaction.product.update({
        ...productSelect,
        where: { id },
        data: { active },
      })
      await transaction.auditLog.create({
        data: auditData(
          active ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
          actorId,
          product.code,
          context,
          productAuditMetadata(product),
        ),
      })
      return product
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

  async getCatalog() {
    const [categories, brands, units] = await Promise.all([
      databaseService.client.productCategory.findMany({
        select: { id: true, name: true, active: true },
        orderBy: { name: 'asc' },
      }),
      databaseService.client.productBrand.findMany({
        select: { id: true, name: true, active: true },
        orderBy: { name: 'asc' },
      }),
      databaseService.client.productUnit.findMany({
        select: { id: true, name: true, symbol: true, active: true },
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

  updateCategory(id: string, name: string) {
    return databaseService.client.productCategory.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, active: true },
    })
  },

  updateBrand(id: string, name: string) {
    return databaseService.client.productBrand.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, active: true },
    })
  },

  updateUnit(id: string, name: string, symbol: string) {
    return databaseService.client.productUnit.update({
      where: { id },
      data: { name, symbol },
      select: { id: true, name: true, symbol: true, active: true },
    })
  },

  updateCategoryStatus(id: string, active: boolean) {
    return databaseService.client.productCategory.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, active: true },
    })
  },

  updateBrandStatus(id: string, active: boolean) {
    return databaseService.client.productBrand.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, active: true },
    })
  },

  updateUnitStatus(id: string, active: boolean) {
    return databaseService.client.productUnit.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, symbol: true, active: true },
    })
  },
}

export type ProductRecord = NonNullable<
  Awaited<ReturnType<typeof productsRepository.findById>>
>
