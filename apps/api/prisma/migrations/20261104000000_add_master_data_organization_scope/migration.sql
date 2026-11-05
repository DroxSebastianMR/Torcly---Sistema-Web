-- Fase 2.1 de multitenencia: los catálogos y personas operativas pertenecen
-- a una organización. Esta migración debe aplicarse únicamente después de
-- crear la organización de destino y validar el plan de backfill.

ALTER TABLE "customers" ADD COLUMN "organization_id" UUID;
ALTER TABLE "vehicles" ADD COLUMN "organization_id" UUID;
ALTER TABLE "product_categories" ADD COLUMN "organization_id" UUID;
ALTER TABLE "product_brands" ADD COLUMN "organization_id" UUID;
ALTER TABLE "product_units" ADD COLUMN "organization_id" UUID;
ALTER TABLE "products" ADD COLUMN "organization_id" UUID;
ALTER TABLE "services" ADD COLUMN "organization_id" UUID;
ALTER TABLE "technicians" ADD COLUMN "organization_id" UUID;

-- Política de transición segura: el backfill solo se permite cuando existe
-- exactamente una organización. Así nunca se asignan datos legados a un
-- taller arbitrario si el entorno ya contiene más de un tenant.
DO $$
DECLARE
  default_organization_id UUID;
  organization_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO organization_count FROM "organizations";
  SELECT "id" INTO default_organization_id
  FROM "organizations"
  ORDER BY "created_at" ASC
  LIMIT 1;

  IF organization_count <> 1 THEN
    RAISE EXCEPTION 'El backfill requiere exactamente una organización; se encontraron %', organization_count;
  END IF;

  UPDATE "customers" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "vehicles" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "product_categories" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "product_brands" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "product_units" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "products" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "services" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "technicians" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "customers" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "vehicles" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "product_categories" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "product_brands" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "product_units" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "services" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "technicians" ALTER COLUMN "organization_id" SET NOT NULL;

-- Las claves únicas históricas fueron creadas como índices por las migraciones
-- iniciales de Prisma; se sustituyen por índices compuestos con organization_id.
DROP INDEX IF EXISTS "customers_document_number_key";
DROP INDEX IF EXISTS "vehicles_plate_key";
DROP INDEX IF EXISTS "product_categories_name_key";
DROP INDEX IF EXISTS "product_brands_name_key";
DROP INDEX IF EXISTS "product_units_name_key";
DROP INDEX IF EXISTS "product_units_symbol_key";
DROP INDEX IF EXISTS "products_code_key";
DROP INDEX IF EXISTS "products_barcode_key";
DROP INDEX IF EXISTS "services_code_key";
DROP INDEX IF EXISTS "technicians_code_key";
DROP INDEX IF EXISTS "technicians_document_key";
DROP INDEX IF EXISTS "technicians_email_key";

CREATE UNIQUE INDEX "customers_organization_id_document_number_key" ON "customers"("organization_id", "document_number");
CREATE UNIQUE INDEX "vehicles_organization_id_plate_key" ON "vehicles"("organization_id", "plate");
CREATE UNIQUE INDEX "product_categories_organization_id_name_key" ON "product_categories"("organization_id", "name");
CREATE UNIQUE INDEX "product_brands_organization_id_name_key" ON "product_brands"("organization_id", "name");
CREATE UNIQUE INDEX "product_units_organization_id_name_key" ON "product_units"("organization_id", "name");
CREATE UNIQUE INDEX "product_units_organization_id_symbol_key" ON "product_units"("organization_id", "symbol");
CREATE UNIQUE INDEX "products_organization_id_code_key" ON "products"("organization_id", "code");
CREATE UNIQUE INDEX "products_organization_id_barcode_key" ON "products"("organization_id", "barcode");
CREATE UNIQUE INDEX "services_organization_id_code_key" ON "services"("organization_id", "code");
CREATE UNIQUE INDEX "technicians_organization_id_code_key" ON "technicians"("organization_id", "code");
CREATE UNIQUE INDEX "technicians_organization_id_document_key" ON "technicians"("organization_id", "document");
CREATE UNIQUE INDEX "technicians_organization_id_email_key" ON "technicians"("organization_id", "email");

CREATE INDEX "customers_organization_id_type_idx" ON "customers"("organization_id", "type");
CREATE INDEX "vehicles_organization_id_customer_id_idx" ON "vehicles"("organization_id", "customer_id");
CREATE INDEX "product_categories_organization_id_active_idx" ON "product_categories"("organization_id", "active");
CREATE INDEX "product_brands_organization_id_active_idx" ON "product_brands"("organization_id", "active");
CREATE INDEX "product_units_organization_id_active_idx" ON "product_units"("organization_id", "active");
CREATE INDEX "products_organization_id_active_name_idx" ON "products"("organization_id", "active", "name");
CREATE INDEX "services_organization_id_active_name_idx" ON "services"("organization_id", "active", "name");
CREATE INDEX "technicians_organization_id_active_full_name_idx" ON "technicians"("organization_id", "active", "full_name");

ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_brands" ADD CONSTRAINT "product_brands_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
