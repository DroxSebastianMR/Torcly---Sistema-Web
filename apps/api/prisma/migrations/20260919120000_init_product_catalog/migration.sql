-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INITIAL', 'ENTRY', 'EXIT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "InventoryMovementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_units" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "symbol" VARCHAR(12) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "barcode" VARCHAR(32),
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "sale_price" DECIMAL(12,2) NOT NULL,
    "minimum_stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "category_id" UUID NOT NULL,
    "brand_id" UUID,
    "unit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "status" "InventoryMovementStatus" NOT NULL DEFAULT 'PENDING',
    "quantity" DECIMAL(12,3) NOT NULL,
    "reference_type" VARCHAR(40),
    "reference_id" VARCHAR(80),
    "idempotency_key" VARCHAR(100),
    "notes" VARCHAR(300),
    "performed_by" VARCHAR(80) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_brands_name_key" ON "product_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_units_name_key" ON "product_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_units_symbol_key" ON "product_units"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_idempotency_key_key" ON "inventory_movements"("idempotency_key");

-- CreateIndex
CREATE INDEX "inventory_movements_product_id_status_occurred_at_idx" ON "inventory_movements"("product_id", "status", "occurred_at");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "product_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "product_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
