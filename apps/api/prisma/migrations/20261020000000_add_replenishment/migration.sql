-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'REPLENISHMENT_RUN_EXECUTED';

-- CreateSequence
CREATE SEQUENCE "replenishment_runs_code_seq" START WITH 1 INCREMENT BY 1;

-- CreateTable
CREATE TABLE "replenishment_runs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "strategy_version" VARCHAR(20) NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "coverage_target_days" INTEGER NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(80) NOT NULL,
    "idempotency_key" VARCHAR(100),
    "eligible_count" INTEGER NOT NULL DEFAULT 0,
    "suggested_total" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "executed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replenishment_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replenishment_recommendations" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_code" VARCHAR(40) NOT NULL,
    "product_name" VARCHAR(120) NOT NULL,
    "unit_label" VARCHAR(20),
    "eligible" BOOLEAN NOT NULL,
    "reason" VARCHAR(40),
    "strategy_version" VARCHAR(20) NOT NULL,
    "stock_current" DECIMAL(14,3),
    "minimum_stock" DECIMAL(12,3),
    "demand_quantity" DECIMAL(14,3) NOT NULL,
    "demand_points" INTEGER NOT NULL,
    "period_days" INTEGER NOT NULL,
    "daily_demand" DECIMAL(14,6),
    "coverage_target_days" INTEGER NOT NULL,
    "target_stock" DECIMAL(14,3),
    "suggested_quantity" DECIMAL(14,3),
    "current_coverage_days" DECIMAL(10,1),
    "priority" VARCHAR(10),
    "explanation" VARCHAR(600) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "replenishment_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "replenishment_runs_code_key" ON "replenishment_runs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "replenishment_runs_idempotency_key_key" ON "replenishment_runs"("idempotency_key");

-- CreateIndex
CREATE INDEX "replenishment_runs_actor_id_idx" ON "replenishment_runs"("actor_id");

-- CreateIndex
CREATE INDEX "replenishment_runs_executed_at_idx" ON "replenishment_runs"("executed_at");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_run_id_sort_order_idx" ON "replenishment_recommendations"("run_id", "sort_order");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_product_id_idx" ON "replenishment_recommendations"("product_id");

-- AddForeignKey
ALTER TABLE "replenishment_runs" ADD CONSTRAINT "replenishment_runs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "replenishment_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
