-- Fase 1 de multitenencia: identidad global, membresías y organización activa.
-- No elimina ni modifica todavía los datos operativos existentes.

CREATE TABLE "organizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(40) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");
CREATE INDEX "organizations_active_name_idx" ON "organizations"("active", "name");

ALTER TABLE "users" ADD COLUMN "is_platform_admin" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "users_is_platform_admin_idx" ON "users"("is_platform_admin");

CREATE TABLE "organization_memberships" (
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("organization_id", "user_id")
);

CREATE INDEX "organization_memberships_user_id_active_idx"
  ON "organization_memberships"("user_id", "active");
CREATE INDEX "organization_memberships_role_id_idx"
  ON "organization_memberships"("role_id");

ALTER TABLE "organization_memberships"
  ADD CONSTRAINT "organization_memberships_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_memberships"
  ADD CONSTRAINT "organization_memberships_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_memberships"
  ADD CONSTRAINT "organization_memberships_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "auth_sessions" ADD COLUMN "active_organization_id" UUID;
CREATE INDEX "auth_sessions_active_organization_id_idx"
  ON "auth_sessions"("active_organization_id");
ALTER TABLE "auth_sessions"
  ADD CONSTRAINT "auth_sessions_active_organization_id_fkey"
  FOREIGN KEY ("active_organization_id") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- La fila inicial y el backfill de datos operativos se ejecutarán en la fase 2
-- mediante un comando de migración con conteos de verificación; no se asume
-- una organización de producción al aplicar esta migración estructural.
