# Guía manual — Sprint 12 Consulta operativa

1. Inicia el proyecto con `pnpm dev`, inicia sesión y abre **Dashboard**.
2. Verifica que las tarjetas visibles correspondan solo a módulos para los que el usuario tiene permiso: citas, órdenes, ventas, caja e inventario.
3. Compara los indicadores con sus pantallas fuente: citas programadas, órdenes no entregadas/rechazadas, ventas confirmadas, saldos pendientes y productos bajo mínimo.
4. Aplica un período válido. Las tarjetas de citas, órdenes y ventas deben cambiar según su campo de fecha; caja e inventario permanecen como instantánea actual.
5. Usa **Limpiar** y confirma que se restaura el resumen sin fechas.
6. En cada tarjeta, pulsa **Ver módulo**. Debe abrir Citas, Órdenes de taller, Ventas, Caja o Inventario, sin UUIDs visibles.
7. Prueba un período sin resultados: la tarjeta debe indicar que no hay elementos que requieran atención, sin inventar valores.
8. Con un usuario sin permiso de una fuente, confirma que esa tarjeta no aparece y que ningún dato restringido se filtra.
9. Confirma que Dashboard no ofrece acciones de creación, edición, cobro, entrega ni movimientos de inventario.

La aprobación requiere que los indicadores concilien con los módulos fuente y que se complete la prueba conjunta pendiente del Sprint 11.
