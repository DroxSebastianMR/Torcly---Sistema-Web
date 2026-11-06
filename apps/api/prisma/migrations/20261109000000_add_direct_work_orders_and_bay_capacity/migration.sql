-- CreateEnum
CREATE TYPE "WorkOrderSource" AS ENUM ('APPOINTMENT', 'WALK_IN');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "mileage" INTEGER;

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "appointment_id" DROP NOT NULL;
ALTER TABLE "work_orders" ADD COLUMN "source" "WorkOrderSource" NOT NULL DEFAULT 'APPOINTMENT';
ALTER TABLE "work_orders" ADD COLUMN "current_mileage" INTEGER;
ALTER TABLE "work_orders" ADD COLUMN "fuel_level" VARCHAR(20);
ALTER TABLE "work_orders" ADD COLUMN "reception_notes" VARCHAR(500);
