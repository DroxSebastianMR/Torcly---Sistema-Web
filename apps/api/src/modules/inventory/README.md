# Inventory (API)

Libro de movimientos y cálculo de stock. Toda modificación es transaccional, idempotente y registra producto, tipo, cantidad, fecha, usuario y origen. Impide cantidades no positivas y stock negativo.

Depende de products y users. Ventas y taller deberán usar sus casos de uso, no escribir movimientos directamente. Sprint propietario: 06.
