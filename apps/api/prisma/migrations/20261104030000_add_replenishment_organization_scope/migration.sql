-- Fase 2.4 de multitenencia: las recomendaciones e historiales de
-- reabastecimiento pertenecen a un único taller.

ALTER TABLE "replenishment_runs" ADD COLUMN "organization_id" UUID;

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

  UPDATE "replenishment_runs"
  SET "organization_id" = default_organization_id
  WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "replenishment_runs" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE INDEX "replenishment_runs_organization_id_executed_at_idx"
  ON "replenishment_runs"("organization_id", "executed_at");

ALTER TABLE "replenishment_runs" ADD CONSTRAINT "replenishment_runs_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
