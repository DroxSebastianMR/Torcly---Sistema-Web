-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'ATENDIDA';

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('RECEPCIONADA', 'EN_DIAGNOSTICO', 'PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "WorkOrderLineType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateSequence
CREATE SEQUENCE "work_orders_code_seq" START WITH 1 INCREMENT BY 1;

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "attended_by" VARCHAR(80),
ADD COLUMN "attended_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "appointment_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'RECEPCIONADA',
    "technician_id" UUID,
    "diagnosis" VARCHAR(1000),
    "diagnosis_updated_by" VARCHAR(80),
    "diagnosis_updated_at" TIMESTAMPTZ(3),
    "budget_sent_by" VARCHAR(80),
    "budget_sent_at" TIMESTAMPTZ(3),
    "approved_by" VARCHAR(80),
    "approved_at" TIMESTAMPTZ(3),
    "rejected_by" VARCHAR(80),
    "rejected_at" TIMESTAMPTZ(3),
    "decision_notes" VARCHAR(500),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "performed_by" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_lines" (
    "id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "type" "WorkOrderLineType" NOT NULL,
    "product_id" UUID,
    "service_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "unit_label" VARCHAR(20),
    "unit_price" DECIMAL(12,2) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_code_key" ON "work_orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_appointment_id_key" ON "work_orders"("appointment_id");

-- CreateIndex
CREATE INDEX "work_orders_customer_id_idx" ON "work_orders"("customer_id");

-- CreateIndex
CREATE INDEX "work_orders_vehicle_id_idx" ON "work_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "work_orders_status_created_at_idx" ON "work_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "work_orders_technician_id_idx" ON "work_orders"("technician_id");

-- CreateIndex
CREATE INDEX "work_orders_created_at_idx" ON "work_orders"("created_at");

-- CreateIndex
CREATE INDEX "work_order_lines_work_order_id_idx" ON "work_order_lines"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_lines_product_id_idx" ON "work_order_lines"("product_id");

-- CreateIndex
CREATE INDEX "work_order_lines_service_id_idx" ON "work_order_lines"("service_id");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_lines" ADD CONSTRAINT "work_order_lines_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_lines" ADD CONSTRAINT "work_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_lines" ADD CONSTRAINT "work_order_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;