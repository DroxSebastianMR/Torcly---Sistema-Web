-- Catálogo operativo de técnicos: no crea cuentas, roles ni sesiones.
-- Se agregan valores sin reconstruir el enum existente para preservar auditorías previas.
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TECHNICIAN_CREATED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TECHNICIAN_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TECHNICIAN_DEACTIVATED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'TECHNICIAN_ACTIVATED';

CREATE SEQUENCE "technicians_code_seq" START WITH 1 INCREMENT BY 1;

CREATE TABLE "technicians" (
  "id" UUID NOT NULL,
  "code" VARCHAR(20) NOT NULL,
  "full_name" VARCHAR(120) NOT NULL,
  "document" VARCHAR(30),
  "phone" VARCHAR(30),
  "email" VARCHAR(254),
  "specialties" VARCHAR(500),
  "notes" VARCHAR(500),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" VARCHAR(80) NOT NULL,
  "updated_by" VARCHAR(80),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "technicians_code_key" ON "technicians"("code");
CREATE UNIQUE INDEX "technicians_document_key" ON "technicians"("document");
CREATE UNIQUE INDEX "technicians_email_key" ON "technicians"("email");
CREATE INDEX "technicians_active_full_name_idx" ON "technicians"("active", "full_name");

ALTER TABLE "work_orders" ADD COLUMN "technician_record_id" UUID;
CREATE INDEX "work_orders_technician_record_id_idx" ON "work_orders"("technician_record_id");
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_technician_record_id_fkey" FOREIGN KEY ("technician_record_id") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
