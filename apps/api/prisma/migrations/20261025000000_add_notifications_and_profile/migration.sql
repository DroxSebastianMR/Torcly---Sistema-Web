-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'PROFILE_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'PASSWORD_CHANGED';
ALTER TYPE "AuditEventType" ADD VALUE 'NOTIFICATION_READ';
ALTER TYPE "AuditEventType" ADD VALUE 'ALL_NOTIFICATIONS_READ';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "notification_preferences" JSONB;

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "link" VARCHAR(255),
    "permission_required" VARCHAR(80),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
