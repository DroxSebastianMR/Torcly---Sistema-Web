-- Fase 2.3 de multitenencia: inventario, ventas, cobros y cajas quedan
-- aislados por organización. Requiere que exista taller-desarrollo para
-- asignar los registros históricos antes de marcar las columnas como NOT NULL.

ALTER TABLE "inventory_movements" ADD COLUMN "organization_id" UUID;
ALTER TABLE "sales" ADD COLUMN "organization_id" UUID;
ALTER TABLE "payments" ADD COLUMN "organization_id" UUID;
ALTER TABLE "cash_sessions" ADD COLUMN "organization_id" UUID;

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

  UPDATE "inventory_movements" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "sales" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "payments" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "cash_sessions" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "inventory_movements" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "cash_sessions" ALTER COLUMN "organization_id" SET NOT NULL;

DROP INDEX IF EXISTS "sales_code_key";
DROP INDEX IF EXISTS "payments_code_key";
DROP INDEX IF EXISTS "cash_sessions_code_key";

CREATE UNIQUE INDEX "sales_organization_id_code_key" ON "sales"("organization_id", "code");
CREATE UNIQUE INDEX "payments_organization_id_code_key" ON "payments"("organization_id", "code");
CREATE UNIQUE INDEX "cash_sessions_organization_id_code_key" ON "cash_sessions"("organization_id", "code");

CREATE INDEX "inventory_movements_organization_id_product_id_status_occurred_at_idx"
  ON "inventory_movements"("organization_id", "product_id", "status", "occurred_at");
CREATE INDEX "inventory_movements_organization_id_status_occurred_at_idx"
  ON "inventory_movements"("organization_id", "status", "occurred_at");
CREATE INDEX "sales_organization_id_customer_id_idx" ON "sales"("organization_id", "customer_id");
CREATE INDEX "sales_organization_id_status_created_at_idx" ON "sales"("organization_id", "status", "created_at");
CREATE INDEX "sales_organization_id_status_confirmed_at_idx" ON "sales"("organization_id", "status", "confirmed_at");
CREATE INDEX "payments_organization_id_sale_id_occurred_at_idx" ON "payments"("organization_id", "sale_id", "occurred_at");
CREATE INDEX "payments_organization_id_cash_session_id_method_occurred_at_idx" ON "payments"("organization_id", "cash_session_id", "method", "occurred_at");
CREATE INDEX "cash_sessions_organization_id_status_opened_at_idx" ON "cash_sessions"("organization_id", "status", "opened_at");

ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
