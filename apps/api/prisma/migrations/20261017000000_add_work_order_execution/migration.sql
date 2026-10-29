-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'EN_EJECUCION';

-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'LISTA_PARA_ENTREGA';

-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'ENTREGADA';

-- CreateEnum
CREATE TYPE "WorkOrderActivityStatus" AS ENUM ('PENDIENTE', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "WorkOrderConsumptionType" AS ENUM ('CONSUMPTION', 'RETURN');

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN "execution_started_by" VARCHAR(80),
ADD COLUMN "execution_started_at" TIMESTAMPTZ(3),
ADD COLUMN "ready_for_delivery_at" TIMESTAMPTZ(3),
ADD COLUMN "delivered_by" VARCHAR(80),
ADD COLUMN "delivered_at" TIMESTAMPTZ(3),
ADD COLUMN "delivery_notes" VARCHAR(500);

-- CreateTable
CREATE TABLE "work_order_activities" (
    "id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performed_by" VARCHAR(80) NOT NULL,
    "status" "WorkOrderActivityStatus" NOT NULL DEFAULT 'PENDIENTE',
    "completed_by" VARCHAR(80),
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "work_order_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_consumptions" (
    "id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "work_order_line_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "type" "WorkOrderConsumptionType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "movement_id" UUID,
    "notes" VARCHAR(300),
    "performed_by" VARCHAR(80) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_order_consumptions_idempotency_key_key" ON "work_order_consumptions"("idempotency_key");

-- CreateIndex
CREATE INDEX "work_order_activities_work_order_id_status_idx" ON "work_order_activities"("work_order_id", "status");

-- CreateIndex
CREATE INDEX "work_order_consumptions_work_order_id_work_order_line_id_idx" ON "work_order_consumptions"("work_order_id", "work_order_line_id");

-- CreateIndex
CREATE INDEX "work_order_consumptions_work_order_id_type_idx" ON "work_order_consumptions"("work_order_id", "type");

-- CreateIndex
CREATE INDEX "work_order_consumptions_product_id_idx" ON "work_order_consumptions"("product_id");

-- AddForeignKey
ALTER TABLE "work_order_activities" ADD CONSTRAINT "work_order_activities_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_consumptions" ADD CONSTRAINT "work_order_consumptions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_consumptions" ADD CONSTRAINT "work_order_consumptions_work_order_line_id_fkey" FOREIGN KEY ("work_order_line_id") REFERENCES "work_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_consumptions" ADD CONSTRAINT "work_order_consumptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_consumptions" ADD CONSTRAINT "work_order_consumptions_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "inventory_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;