import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../shared/errors/app-error.js'
import {
  productsRepository,
  type ProductRecord,
} from './products.repository.js'
import type {
  ProductFilters,
  ProductInput,
  ProductResponse,
} from './products.types.js'

const positiveMovementTypes = new Set(['INITIAL', 'ENTRY', 'ADJUSTMENT_IN'])

function getStock(product: ProductRecord) {
  return product.inventoryMovements.reduce((stock, movement) => {
    const quantity = Number(movement.quantity)
    return positiveMovementTypes.has(movement.type)
      ? stock + quantity
      : stock - quantity
  }, 0)
}

function toResponse(product: ProductRecord): ProductResponse {
  const stock = getStock(product)
  const minimumStock = Number(product.minimumStock)

  return {
    id: product.id,
    code: product.code,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    unitId: product.unitId,
    salePrice: Number(product.salePrice),
    minimumStock,
    stock,
    lowStock: product.active && stock <= minimumStock,
    active: product.active,
    category: product.category,
    brand: product.brand,
    unit: product.unit,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

function mapPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'PRODUCT_DUPLICATE',
        'Ya existe un registro con el mismo código, código de barras o nombre.',
      )
    }

    if (error.code === 'P2003') {
      throw new AppError(
        400,
        'PRODUCT_REFERENCE_INVALID',
        'La categoría, marca o unidad seleccionada no está disponible.',
      )
    }

    if (error.code === 'P2025') {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
    }
  }

  throw error
}

export const productsService = {
  async list(filters: ProductFilters) {
    const result = await productsRepository.list(filters)
    return {
      data: result.items.map(toResponse),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
    }
  },

  async getById(id: string) {
    const product = await productsRepository.findById(id)
    if (!product)
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
    return { data: toResponse(product) }
  },

  async create(input: ProductInput) {
    try {
      return { data: toResponse(await productsRepository.create(input)) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async update(id: string, input: ProductInput) {
    try {
      return { data: toResponse(await productsRepository.update(id, input)) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async updateStatus(id: string, active: boolean) {
    try {
      return {
        data: toResponse(await productsRepository.updateStatus(id, active)),
      }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async getOptions() {
    return { data: await productsRepository.getOptions() }
  },

  async createCategory(name: string) {
    try {
      return { data: await productsRepository.createCategory(name) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async createBrand(name: string) {
    try {
      return { data: await productsRepository.createBrand(name) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },

  async createUnit(name: string, symbol: string) {
    try {
      return { data: await productsRepository.createUnit(name, symbol) }
    } catch (error) {
      return mapPersistenceError(error)
    }
  },
}
