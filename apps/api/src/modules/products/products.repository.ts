import { searchProductPage } from './product-search.js'
import {
  type AuditEventType,
  type InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { ProductInputDto } from './products.schemas.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { ProductFilters, ProductInput } from './products.types.js'

const productListRelations = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, symbol: true } },
} satisfies Prisma.ProductInclude

const productRelations = {
  ...productListRelations,
  inventoryMovements: {
    where: { status: 'CONFIRMED' as const },
    select: { type: true, quantity: true },
  },
} satisfies Prisma.ProductInclude

const productSelect = { include: productRelations } as const
const productListSelect = { include: productListRelations } as const

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
    organizationId: context.organizationId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

type ProductListRecord = Prisma.ProductGetPayload<typeof productListSelect>
type MovementSummary = {
  type: InventoryMovementType
  quantity: Prisma.Decimal
}

function productAuditMetadata(
  product: Pick<
    ProductListRecord,
    | 'id'
    | 'code'
    | 'name'
    | 'categoryId'
    | 'brandId'
    | 'unitId'
    | 'salePrice'
    | 'minimumStock'
    | 'active'
  >,
) {
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

async function getConfirmedMovementSummaries(
  transaction: Prisma.TransactionClient,
  productId: string,
): Promise<MovementSummary[]> {
  const movements = await databaseService.measure(
    'products.mutation.stock',
    () =>
      transaction.inventoryMovement.groupBy({
        by: ['type'],
        where: { productId, status: 'CONFIRMED' },
        _sum: { quantity: true },
      }),
  )

  return movements.map((movement) => ({
    type: movement.type,
    quantity: movement._sum.quantity ?? new Prisma.Decimal(0),
  }))
}

function withMovementSummaries(
  product: ProductListRecord,
  inventoryMovements: MovementSummary[],
): ProductRecord {
  return { ...product, inventoryMovements }
}

function buildWhere(
  filters: ProductFilters,
  organizationId: string,
): Prisma.ProductWhereInput {
  return {
    organizationId,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status === 'active'
      ? { active: true }
      : filters.status === 'inactive'
        ? { active: false }
        : {}),
  }
}

export const productsRepository = {
  async list(filters: ProductFilters, organizationId: string) {
    const page = await searchProductPage(filters, organizationId)
    const where = {
      ...buildWhere(filters, organizationId),
      ...(page && { id: { in: page.ids } }),
    }
    const [items, total] = await Promise.all([
      databaseService.measure('products.list.records', () =>
        databaseService.client.product.findMany({
          ...productListSelect,
          where,
          orderBy: [{ active: 'desc' }, { name: 'asc' }, { id: 'asc' }],
          skip: page ? 0 : (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
      ),
      page?.total ??
        databaseService.measure('products.list.total', () =>
          databaseService.client.product.count({ where }),
        ),
    ])

    if (!items.length) return { items: [], total }

    const grouped = await databaseService.measure('products.list.stock', () =>
      databaseService.client.inventoryMovement.groupBy({
        by: ['productId', 'type'],
        where: {
          status: 'CONFIRMED',
          productId: { in: items.map((item) => item.id) },
        },
        _sum: { quantity: true },
      }),
    )
    const movementsByProduct = new Map<string, MovementSummary[]>()
    for (const movement of grouped) {
      const movements = movementsByProduct.get(movement.productId) ?? []
      movements.push({
        type: movement.type,
        quantity: movement._sum.quantity ?? new Prisma.Decimal(0),
      })
      movementsByProduct.set(movement.productId, movements)
    }

    return {
      items: items.map((item) => ({
        ...item,
        inventoryMovements: movementsByProduct.get(item.id) ?? [],
      })),
      total,
    }
  },

  findById(id: string, organizationId: string) {
    return databaseService.client.product.findFirst({
      ...productSelect,
      where: { id, organizationId },
    })
  },

  async isCodeAvailable(
    code: string,
    organizationId: string,
    excludeId?: string,
  ) {
    const product = await databaseService.client.product.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
    return product === null
  },

  create(
    input: ProductInputDto,
    actorId: string,
    organizationId: string,
    context: RequestContext,
    actorName = actorId,
  ) {
    return databaseService.transaction(async (transaction) => {
      const [category, unit, brand] = await Promise.all([
        transaction.productCategory.findFirst({
          where: { id: input.categoryId, organizationId, active: true },
          select: { id: true },
        }),
        transaction.productUnit.findFirst({
          where: { id: input.unitId, organizationId, active: true },
          select: { id: true },
        }),
        input.brandId
          ? transaction.productBrand.findFirst({
              where: { id: input.brandId, organizationId, active: true },
              select: { id: true },
            })
          : Promise.resolve(null),
      ])
      if (!category || !unit || (input.brandId && !brand)) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Product reference not found',
          { code: 'P2003', clientVersion: Prisma.prismaVersion.client },
        )
      }
      const { initialStock, ...fields } = input
      const product = await databaseService.measure(
        'products.create.record',
        () =>
          transaction.product.create({
            ...productListSelect,
            data: { ...fields, organizationId },
          }),
      )
      await databaseService.measure('products.create.audit', () =>
        transaction.auditLog.create({
          data: auditData(
            'PRODUCT_CREATED',
            actorId,
            product.code,
            context,
            productAuditMetadata(product),
          ),
        }),
      )
      if (!initialStock) return withMovementSummaries(product, [])
      const movement = await transaction.inventoryMovement.create({
        data: {
          organizationId,
          productId: product.id,
          type: 'INITIAL',
          status: 'CONFIRMED',
          quantity: initialStock,
          performedBy: actorName,
          notes: 'Stock inicial al registrar el producto.',
        },
        select: { id: true, type: true, quantity: true },
      })
      await transaction.auditLog.create({
        data: auditData(
          'INVENTORY_STOCK_INITIALIZED',
          actorId,
          product.code,
          context,
          {
            productId: product.id,
            movementId: movement.id,
            type: movement.type,
            quantity: initialStock,
            stockAfter: initialStock,
          },
        ),
      })
      return withMovementSummaries(product, [movement])
    })
  },

  update(
    id: string,
    input: ProductInput,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const [category, unit, brand] = await Promise.all([
        transaction.productCategory.findFirst({
          where: { id: input.categoryId, organizationId, active: true },
          select: { id: true },
        }),
        transaction.productUnit.findFirst({
          where: { id: input.unitId, organizationId, active: true },
          select: { id: true },
        }),
        input.brandId
          ? transaction.productBrand.findFirst({
              where: { id: input.brandId, organizationId, active: true },
              select: { id: true },
            })
          : Promise.resolve(null),
      ])
      if (!category || !unit || (input.brandId && !brand)) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Product reference not found',
          { code: 'P2003', clientVersion: Prisma.prismaVersion.client },
        )
      }
      const existing = await transaction.product.findFirst({
        where: { id, organizationId },
        select: { id: true },
      })
      if (!existing) {
        throw new Prisma.PrismaClientKnownRequestError('Product not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const product = await databaseService.measure(
        'products.update.record',
        () =>
          transaction.product.update({
            ...productListSelect,
            where: { id },
            data: input,
          }),
      )
      await databaseService.measure('products.update.audit', () =>
        transaction.auditLog.create({
          data: auditData(
            'PRODUCT_UPDATED',
            actorId,
            product.code,
            context,
            productAuditMetadata(product),
          ),
        }),
      )
      return withMovementSummaries(
        product,
        await getConfirmedMovementSummaries(transaction, product.id),
      )
    })
  },

  updateStatus(
    id: string,
    active: boolean,
    actorId: string,
    organizationId: string,
    context: RequestContext,
  ) {
    return databaseService.transaction(async (transaction) => {
      const existing = await transaction.product.findFirst({
        where: { id, organizationId },
        select: { id: true },
      })
      if (!existing) {
        throw new Prisma.PrismaClientKnownRequestError('Product not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      }
      const product = await databaseService.measure(
        'products.status.record',
        () =>
          transaction.product.update({
            ...productListSelect,
            where: { id },
            data: { active },
          }),
      )
      await databaseService.measure('products.status.audit', () =>
        transaction.auditLog.create({
          data: auditData(
            active ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
            actorId,
            product.code,
            context,
            productAuditMetadata(product),
          ),
        }),
      )
      return withMovementSummaries(
        product,
        await getConfirmedMovementSummaries(transaction, product.id),
      )
    })
  },

  async getOptions(organizationId: string) {
    const [categories, brands, units] = await Promise.all([
      databaseService.measure('products.options.categories', () =>
        databaseService.client.productCategory.findMany({
          where: { active: true, organizationId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
      ),
      databaseService.measure('products.options.brands', () =>
        databaseService.client.productBrand.findMany({
          where: { active: true, organizationId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
      ),
      databaseService.measure('products.options.units', () =>
        databaseService.client.productUnit.findMany({
          where: { active: true, organizationId },
          select: { id: true, name: true, symbol: true },
          orderBy: { name: 'asc' },
        }),
      ),
    ])

    return { categories, brands, units }
  },

  async getCatalog(organizationId: string) {
    const [categories, brands, units] = await Promise.all([
      databaseService.measure('products.catalog.categories', () =>
        databaseService.client.productCategory.findMany({
          where: { organizationId },
          select: { id: true, name: true, active: true },
          orderBy: { name: 'asc' },
        }),
      ),
      databaseService.measure('products.catalog.brands', () =>
        databaseService.client.productBrand.findMany({
          where: { organizationId },
          select: { id: true, name: true, active: true },
          orderBy: { name: 'asc' },
        }),
      ),
      databaseService.measure('products.catalog.units', () =>
        databaseService.client.productUnit.findMany({
          where: { organizationId },
          select: { id: true, name: true, symbol: true, active: true },
          orderBy: { name: 'asc' },
        }),
      ),
    ])

    return { categories, brands, units }
  },

  createCategory(name: string, organizationId: string) {
    return databaseService.client.productCategory.create({
      data: { name, organizationId },
      select: { id: true, name: true },
    })
  },

  createBrand(name: string, organizationId: string) {
    return databaseService.client.productBrand.create({
      data: { name, organizationId },
      select: { id: true, name: true },
    })
  },

  createUnit(name: string, symbol: string, organizationId: string) {
    return databaseService.client.productUnit.create({
      data: { name, symbol, organizationId },
      select: { id: true, name: true, symbol: true },
    })
  },

  async updateCategory(id: string, name: string, organizationId: string) {
    const result = await databaseService.client.productCategory.updateMany({
      where: { id, organizationId },
      data: { name },
    })
    if (!result.count) {
      throw new Prisma.PrismaClientKnownRequestError('Category not found', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      })
    }
    return databaseService.client.productCategory.findFirstOrThrow({
      where: { id, organizationId },
      select: { id: true, name: true, active: true },
    })
  },

  async updateBrand(id: string, name: string, organizationId: string) {
    const result = await databaseService.client.productBrand.updateMany({
      where: { id, organizationId },
      data: { name },
    })
    if (!result.count) {
      throw new Prisma.PrismaClientKnownRequestError('Brand not found', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      })
    }
    return databaseService.client.productBrand.findFirstOrThrow({
      where: { id, organizationId },
      select: { id: true, name: true, active: true },
    })
  },

  async updateUnit(
    id: string,
    name: string,
    symbol: string,
    organizationId: string,
  ) {
    const result = await databaseService.client.productUnit.updateMany({
      where: { id, organizationId },
      data: { name, symbol },
    })
    if (!result.count) {
      throw new Prisma.PrismaClientKnownRequestError('Unit not found', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      })
    }
    return databaseService.client.productUnit.findFirstOrThrow({
      where: { id, organizationId },
      select: { id: true, name: true, symbol: true, active: true },
    })
  },

  async updateCategoryStatus(
    id: string,
    active: boolean,
    organizationId: string,
  ) {
    const result = await databaseService.client.productCategory.updateMany({
      where: { id, organizationId },
      data: { active },
    })
    if (!result.count) {
      throw new Prisma.PrismaClientKnownRequestError('Category not found', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      })
    }
    return databaseService.client.productCategory.findFirstOrThrow({
      where: { id, organizationId },
      select: { id: true, name: true, active: true },
    })
  },

  async updateBrandStatus(id: string, active: boolean, organizationId: string) {
    const result = await databaseService.client.productBrand.updateMany({
      where: { id, organizationId },
      data: { active },
    })
    if (!result.count) {
      throw new Prisma.PrismaClientKnownRequestError('Brand not found', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      })
    }
    return databaseService.client.productBrand.findFirstOrThrow({
      where: { id, organizationId },
      select: { id: true, name: true, active: true },
    })
  },

  async updateUnitStatus(id: string, active: boolean, organizationId: string) {
    const result = await databaseService.client.productUnit.updateMany({
      where: { id, organizationId },
      data: { active },
    })
    if (!result.count) {
      throw new Prisma.PrismaClientKnownRequestError('Unit not found', {
        code: 'P2025',
        clientVersion: Prisma.prismaVersion.client,
      })
    }
    return databaseService.client.productUnit.findFirstOrThrow({
      where: { id, organizationId },
      select: { id: true, name: true, symbol: true, active: true },
    })
  },
}

export type ProductRecord = ProductListRecord & {
  inventoryMovements: MovementSummary[]
}
