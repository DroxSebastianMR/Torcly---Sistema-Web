-- El historial del asistente también se separa por organización.
ALTER TABLE "assistant_conversations" ADD COLUMN "organization_id" UUID;

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

  UPDATE "assistant_conversations"
  SET "organization_id" = default_organization_id
  WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "assistant_conversations"
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "assistant_conversations"
  ADD CONSTRAINT "assistant_conversations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "assistant_conversations_user_id_updated_at_idx";
CREATE INDEX "assistant_conversations_organization_id_user_id_updated_at_idx"
  ON "assistant_conversations"("organization_id", "user_id", "updated_at");
