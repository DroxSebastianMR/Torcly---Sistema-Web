# Prompt de implementación - Sprint 17

```text
Implementa únicamente el Sprint 17 - Compras y recepción de proveedores en Torcly.

Antes de editar, lee por completo README.md, acceptance-and-test-plan.md y approval.md de docs/03-sprints/sprint-17-purchases, además de docs/04-calidad/definition-of-done.md. Revisa los módulos inventory, products, sales, payments y audit para reutilizar patrones reales.

Construye proveedores y compras con borrador, líneas de productos existentes, total calculado por servidor, recepción confirmable una sola vez, historial, filtros, permisos purchases:read/purchases:write y auditoría. La recepción debe crear movimientos ENTRY confirmados dentro de una transacción, con advisory locks e idempotencia por requestId. Una compra recibida es inmutable; no reviertas movimientos originales ni permitas pagos a proveedores en este sprint.

Si se requiere persistencia, crea migraciones nuevas y no las apliques ni ejecutes seed. Implementa API y web con schemas, guards, contratos tipados, estados loading/empty/error/restricted y pruebas unitarias e integración gated. Mantén las cantidades hasta tres decimales. Ejecuta verificaciones completas, documenta resultados reales y deja approval.md como “Listo para prueba del usuario”. No hagas commit ni push.
```
