-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('NATURAL', 'LEGAL');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "type" "CustomerType" NOT NULL,
    "document_number" VARCHAR(11) NOT NULL,
    "first_name" VARCHAR(80),
    "last_name" VARCHAR(80),
    "legal_name" VARCHAR(160),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(254),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_number_key" ON "customers"("document_number");
CREATE INDEX "customers_type_idx" ON "customers"("type");
CREATE INDEX "customers_last_name_idx" ON "customers"("last_name");
CREATE INDEX "customers_legal_name_idx" ON "customers"("legal_name");
CREATE INDEX "customers_phone_idx" ON "customers"("phone");