-- Preserve catalog and inventory invariants at the database boundary.
ALTER TABLE "products"
ADD CONSTRAINT "products_sale_price_nonnegative" CHECK ("sale_price" >= 0),
ADD CONSTRAINT "products_minimum_stock_nonnegative" CHECK ("minimum_stock" >= 0);

ALTER TABLE "inventory_movements"
ADD CONSTRAINT "inventory_movements_quantity_positive" CHECK ("quantity" > 0);
