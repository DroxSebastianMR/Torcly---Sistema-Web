-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'DIGITAL_WALLET');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'COMPENSATION');

-- CreateSequence
CREATE SEQUENCE "payments_code_seq" START WITH 1 INCREMENT BY 1;

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "sale_id" UUID NOT NULL,
    "customer_id" UUID,
    "type" "PaymentType" NOT NULL DEFAULT 'PAYMENT',
    "original_payment_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "notes" VARCHAR(300),
    "reason" VARCHAR(300),
    "performed_by" VARCHAR(80) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_code_key" ON "payments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_sale_id_occurred_at_idx" ON "payments"("sale_id", "occurred_at");

-- CreateIndex
CREATE INDEX "payments_sale_id_method_idx" ON "payments"("sale_id", "method");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_method_occurred_at_idx" ON "payments"("method", "occurred_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_original_payment_id_fkey" FOREIGN KEY ("original_payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;