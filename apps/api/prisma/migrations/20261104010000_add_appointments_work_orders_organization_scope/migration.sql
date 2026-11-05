-- Fase 2.2 de multitenencia: una cita y su orden de taller pertenecen a la
-- misma organización. No ejecutar sin validar primero la organización usada
-- para el backfill de datos existentes.

ALTER TABLE "appointments" ADD COLUMN "organization_id" UUID;
ALTER TABLE "work_orders" ADD COLUMN "organization_id" UUID;

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

  UPDATE "appointments" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
  UPDATE "work_orders" SET "organization_id" = default_organization_id WHERE "organization_id" IS NULL;
END $$;

ALTER TABLE "appointments" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "work_orders" ALTER COLUMN "organization_id" SET NOT NULL;

CREATE INDEX "appointments_organization_id_date_time_idx" ON "appointments"("organization_id", "date", "time");
CREATE INDEX "appointments_organization_id_status_date_time_idx" ON "appointments"("organization_id", "status", "date", "time");
CREATE INDEX "appointments_organization_id_status_created_at_idx" ON "appointments"("organization_id", "status", "created_at");
CREATE INDEX "work_orders_organization_id_appointment_id_idx" ON "work_orders"("organization_id", "appointment_id");
CREATE INDEX "work_orders_organization_id_customer_id_idx" ON "work_orders"("organization_id", "customer_id");
CREATE INDEX "work_orders_organization_id_vehicle_id_idx" ON "work_orders"("organization_id", "vehicle_id");
CREATE INDEX "work_orders_organization_id_status_created_at_idx" ON "work_orders"("organization_id", "status", "created_at");
CREATE INDEX "work_orders_organization_id_technician_record_id_idx" ON "work_orders"("organization_id", "technician_record_id");
CREATE INDEX "work_orders_organization_id_created_at_idx" ON "work_orders"("organization_id", "created_at");

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
