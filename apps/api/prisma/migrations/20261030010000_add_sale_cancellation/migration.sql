ALTER TYPE "SaleStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'SALE_CANCELLED';

ALTER TABLE "sales"
  ADD COLUMN "cancelled_by" VARCHAR(80),
  ADD COLUMN "cancelled_at" TIMESTAMPTZ(3),
  ADD COLUMN "cancellation_reason" VARCHAR(300);

CREATE INDEX "sales_status_cancelled_at_idx"
  ON "sales"("status", "cancelled_at");
