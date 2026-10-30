# Prompt de implementación - Sprint 22

Implementa exclusivamente Sprint 22: Rediseño de reportes y exportación XLSX. Lee el README, el plan de aceptación y el acta de este sprint, además de los módulos `reports`, `sales`, `payments`, `inventory`, `services`, `work-orders`, `operations` y las convenciones de UI compartida.

Usa una base de gráficos reutilizable sobre Recharts. Mantén los filtros de período, permisos existentes y las tablas trazables. Enriquece los DTOs de tendencia de Cobros (bruto, compensado, neto), Inventario (movimientos por tipo) y Taller (creadas, entregadas) sin romper los consumidores existentes.

Añade `GET /api/v1/reports/export` para generar un XLSX en servidor. Debe respetar `reports:read` y los permisos por bloque; no puede exportar módulos no autorizados, PII innecesaria ni identificadores internos. El navegador solo descarga el archivo; no recibe claves ni consulta directamente la base de datos. Incluye Resumen y hojas para los bloques permitidos.

No crees migraciones ni modifiques datos. Añade pruebas, actualiza documentación y deja `approval.md` como "Listo para prueba del usuario" solo al finalizar verificaciones. No hagas commit ni push.
