-- Apertura y cierre manual de caja. Los pagos históricos permanecen sin sesión.
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');

ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'CASH_SESSION_OPENED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'CASH_SESSION_CLOSED';

CREATE SEQUENCE "cash_sessions_code_seq" START WITH 1 INCREMENT BY 1;

CREATE TABLE "cash_sessions" (
  "id" UUID NOT NULL,
  "code" VARCHAR(20) NOT NULL,
  "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
  "opening_amount" DECIMAL(12,2) NOT NULL,
  "opening_notes" VARCHAR(300),
  "opened_by" VARCHAR(80) NOT NULL,
  "opened_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "opening_idempotency_key" VARCHAR(100) NOT NULL,
  "expected_cash_amount" DECIMAL(12,2),
  "counted_cash_amount" DECIMAL(12,2),
  "difference_amount" DECIMAL(12,2),
  "closing_notes" VARCHAR(300),
  "closed_by" VARCHAR(80),
  "closed_at" TIMESTAMPTZ(3),
  "closing_idempotency_key" VARCHAR(100),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cash_sessions_code_key" ON "cash_sessions"("code");
CREATE UNIQUE INDEX "cash_sessions_opening_idempotency_key_key" ON "cash_sessions"("opening_idempotency_key");
CREATE UNIQUE INDEX "cash_sessions_closing_idempotency_key_key" ON "cash_sessions"("closing_idempotency_key");
CREATE INDEX "cash_sessions_status_opened_at_idx" ON "cash_sessions"("status", "opened_at");
CREATE INDEX "cash_sessions_closed_at_idx" ON "cash_sessions"("closed_at");
-- Prisma no representa índices parciales: esta restricción protege la caja única.
CREATE UNIQUE INDEX "cash_sessions_single_open_idx" ON "cash_sessions"(("status")) WHERE "status" = 'OPEN';

ALTER TABLE "payments" ADD COLUMN "cash_session_id" UUID;
CREATE INDEX "payments_cash_session_id_method_occurred_at_idx" ON "payments"("cash_session_id", "method", "occurred_at");
ALTER TABLE "payments" ADD CONSTRAINT "payments_cash_session_id_fkey" FOREIGN KEY ("cash_session_id") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
