import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { databaseService } from '../src/infrastructure/database/prisma.service.js'

const app = createApp()
const suffix = Date.now().toString(36).toUpperCase()
const created: {
  productId?: string
  categoryId?: string
  brandId?: string
  unitId?: string
} = {}

async function runSmokeTest() {
  await databaseService.connect()

  try {
    const category = await request(app)
      .post('/api/v1/products/categories')
      .send({ name: `QA Categoría ${suffix}` })
    assert.equal(category.status, 201)
    created.categoryId = category.body.data.id

    const brand = await request(app)
      .post('/api/v1/products/brands')
      .send({ name: `QA Marca ${suffix}` })
    assert.equal(brand.status, 201)
    created.brandId = brand.body.data.id

    const unit = await request(app)
      .post('/api/v1/products/units')
      .send({ name: `QA Unidad ${suffix}`, symbol: `q${suffix.slice(-5)}` })
    assert.equal(unit.status, 201)
    created.unitId = unit.body.data.id

    const product = await request(app)
      .post('/api/v1/products')
      .send({
        code: `QA-${suffix}`,
        barcode: null,
        name: `Producto de verificación ${suffix}`,
        description: 'Registro temporal de control automático.',
        categoryId: created.categoryId,
        brandId: created.brandId,
        unitId: created.unitId,
        salePrice: 25.9,
        minimumStock: 2,
      })
    assert.equal(product.status, 201)
    assert.equal(product.body.data.stock, 0)
    assert.equal(product.body.data.lowStock, true)
    created.productId = product.body.data.id

    const listing = await request(app)
      .get('/api/v1/products')
      .query({ search: `QA-${suffix}` })
    assert.equal(listing.status, 200)
    assert.equal(listing.body.pagination.total, 1)

    const status = await request(app)
      .patch(`/api/v1/products/${created.productId}/status`)
      .send({ active: false })
    assert.equal(status.status, 200)
    assert.equal(status.body.data.active, false)

    console.info('Módulo de productos: CRUD y reglas principales verificados')
  } finally {
    if (created.productId) {
      await databaseService.client.product.delete({
        where: { id: created.productId },
      })
    }
    if (created.categoryId) {
      await databaseService.client.productCategory.delete({
        where: { id: created.categoryId },
      })
    }
    if (created.brandId) {
      await databaseService.client.productBrand.delete({
        where: { id: created.brandId },
      })
    }
    if (created.unitId) {
      await databaseService.client.productUnit.delete({
        where: { id: created.unitId },
      })
    }
    await databaseService.disconnect()
  }
}

void runSmokeTest().catch(() => {
  console.error('No se pudo verificar el módulo de productos.')
  process.exitCode = 1
})
