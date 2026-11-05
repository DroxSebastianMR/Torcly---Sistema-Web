-- Compras y proveedores pertenecen a una única organización.
ALTER TABLE "suppliers" ADD COLUMN "organization_id" UUID;
ALTER TABLE "purchases" ADD COLUMN "organization_id" UUID;

-- El backfill solo es seguro si el entorno tiene un único tenant.
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

  UPDATE "suppliers" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "purchases" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "suppliers" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "purchases" ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "suppliers"
  ADD CONSTRAINT "suppliers_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchases"
  ADD CONSTRAINT "purchases_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "suppliers_document_number_key";
DROP INDEX IF EXISTS "purchases_code_key";
DROP INDEX IF EXISTS "purchases_idempotency_key_key";

CREATE UNIQUE INDEX "suppliers_organization_id_document_number_key"
  ON "suppliers"("organization_id", "document_number");
CREATE UNIQUE INDEX "purchases_organization_id_code_key"
  ON "purchases"("organization_id", "code");
CREATE UNIQUE INDEX "purchases_organization_id_idempotency_key_key"
  ON "purchases"("organization_id", "idempotency_key");
CREATE INDEX "suppliers_organization_id_active_idx"
  ON "suppliers"("organization_id", "active");
CREATE INDEX "purchases_organization_id_supplier_id_idx"
  ON "purchases"("organization_id", "supplier_id");
CREATE INDEX "purchases_organization_id_status_idx"
  ON "purchases"("organization_id", "status");
CREATE INDEX "purchases_organization_id_purchase_date_idx"
  ON "purchases"("organization_id", "purchase_date");
