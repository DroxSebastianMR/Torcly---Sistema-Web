-- La auditoría operativa pertenece explícitamente al taller donde ocurrió.
-- Es nullable para conservar eventos históricos, de autenticación y de
-- plataforma que no tienen contexto de organización.
ALTER TABLE "audit_logs"
  ADD COLUMN "organization_id" UUID;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "audit_logs_organization_id_created_at_idx"
  ON "audit_logs"("organization_id", "created_at");

-- El rol global conserva su código técnico "administrator", pero se muestra
-- como dueño del taller para diferenciarlo del administrador de plataforma.
UPDATE "roles"
SET "name" = 'Dueño del taller'
WHERE "code" = 'administrator';
