-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'RECEIVED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'SUPPLIER_CREATED';
ALTER TYPE "AuditEventType" ADD VALUE 'SUPPLIER_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'SUPPLIER_DEACTIVATED';
ALTER TYPE "AuditEventType" ADD VALUE 'SUPPLIER_ACTIVATED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_CREATED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_CONFIRMED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_CANCELLED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_LINE_ADDED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_LINE_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'PURCHASE_LINE_DELETED';

-- CreateSequence
CREATE SEQUENCE "purchases_code_seq" START 1;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legal_name" VARCHAR(150) NOT NULL,
    "document_number" VARCHAR(30) NOT NULL,
    "contact_name" VARCHAR(100),
    "phone" VARCHAR(30),
    "email" VARCHAR(254),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "external_ref" VARCHAR(80),
    "purchase_date" DATE NOT NULL,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "performed_by" VARCHAR(120) NOT NULL,
    "received_by" VARCHAR(120),
    "received_at" TIMESTAMPTZ(3),
    "cancelled_by" VARCHAR(120),
    "cancelled_at" TIMESTAMPTZ(3),
    "notes" VARCHAR(500),
    "idempotency_key" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit_cost" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "product_name" VARCHAR(120) NOT NULL,
    "product_code" VARCHAR(40) NOT NULL,
    "unit_label" VARCHAR(20),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "purchase_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_document_number_key" ON "suppliers"("document_number");
CREATE INDEX "suppliers_active_idx" ON "suppliers"("active");
CREATE INDEX "suppliers_document_number_idx" ON "suppliers"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_code_key" ON "purchases"("code");
CREATE UNIQUE INDEX "purchases_idempotency_key_key" ON "purchases"("idempotency_key");
CREATE INDEX "purchases_supplier_id_idx" ON "purchases"("supplier_id");
CREATE INDEX "purchases_status_idx" ON "purchases"("status");
CREATE INDEX "purchases_purchase_date_idx" ON "purchases"("purchase_date");

-- CreateIndex
CREATE INDEX "purchase_lines_purchase_id_idx" ON "purchase_lines"("purchase_id");
CREATE INDEX "purchase_lines_product_id_idx" ON "purchase_lines"("product_id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
