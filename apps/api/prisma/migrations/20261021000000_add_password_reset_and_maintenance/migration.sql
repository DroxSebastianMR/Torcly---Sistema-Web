-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'PASSWORD_RESET_REQUESTED';

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'PASSWORD_RESET_COMPLETED';

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'MAINTENANCE_SCHEDULED';

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'MAINTENANCE_CANCELLED';

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "token_hash" CHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "request_id" VARCHAR(80),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "maintenance_windows" (
    "id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "message" VARCHAR(300) NOT NULL,
    "created_by" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_consumed_at_idx" ON "password_reset_tokens"("user_id", "consumed_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "maintenance_windows_starts_at_ends_at_idx" ON "maintenance_windows"("starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
