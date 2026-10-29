-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PROGRAMADA', 'CANCELADA');

-- CreateSequence
CREATE SEQUENCE "appointments_code_seq" START WITH 1 INCREMENT BY 1;

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME(0) NOT NULL,
    "reason" VARCHAR(300) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PROGRAMADA',
    "performed_by" VARCHAR(80) NOT NULL,
    "rescheduled_by" VARCHAR(80),
    "rescheduled_at" TIMESTAMPTZ(3),
    "cancelled_by" VARCHAR(80),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointments_code_key" ON "appointments"("code");

-- CreateIndex
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- CreateIndex
CREATE INDEX "appointments_vehicle_id_idx" ON "appointments"("vehicle_id");

-- CreateIndex
CREATE INDEX "appointments_date_time_idx" ON "appointments"("date", "time");

-- CreateIndex
CREATE INDEX "appointments_status_date_time_idx" ON "appointments"("status", "date", "time");

-- CreateIndex
CREATE INDEX "appointments_status_created_at_idx" ON "appointments"("status", "created_at");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;