-- Vincula la venta de cobro generada al entregar una orden de taller.
-- Las ventas directas existentes permanecen sin vínculo.
ALTER TABLE "sales" ADD COLUMN "work_order_id" UUID;

CREATE UNIQUE INDEX "sales_work_order_id_key" ON "sales"("work_order_id");

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_work_order_id_fkey"
  FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
