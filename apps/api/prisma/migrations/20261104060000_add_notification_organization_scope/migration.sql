-- Cada aviso operativo pertenece al taller que originó el evento.
ALTER TABLE "notifications"
  ADD COLUMN "organization_id" UUID;

-- El backfill falla de forma segura si hay más de una organización.
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

  UPDATE "notifications"
  SET "organization_id" = default_organization_id
  WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "notifications"
  ALTER COLUMN "organization_id" SET NOT NULL,
  ADD CONSTRAINT "notifications_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "notifications_organization_id_user_id_created_at_idx"
  ON "notifications"("organization_id", "user_id", "created_at");
