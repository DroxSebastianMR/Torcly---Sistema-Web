-- Índices de lectura para Dashboard, Reportes e Inventario.
-- No alteran datos ni el comportamiento de las operaciones transaccionales.

CREATE INDEX "products_active_name_idx" ON "products"("active", "name");

CREATE INDEX "services_active_name_idx" ON "services"("active", "name");

CREATE INDEX "inventory_movements_status_occurred_at_idx"
  ON "inventory_movements"("status", "occurred_at");

CREATE INDEX "sales_status_confirmed_at_idx"
  ON "sales"("status", "confirmed_at");

CREATE INDEX "sale_lines_type_sale_id_idx"
  ON "sale_lines"("type", "sale_id");

CREATE INDEX "payments_occurred_at_idx" ON "payments"("occurred_at");
