# Acta de aprobación - Sprint 17 Compras y recepción de proveedores

## Estado

**Listo para prueba del usuario.** La implementación y las verificaciones automatizadas están completas; no existe aún aprobación expresa del responsable. Quedan pendientes la validación manual del usuario y la ejecución de migraciones en el entorno de prueba cuando sea autorizada.

## Para aprobar

- [x] Proveedores y compras borrador funcionan con validaciones claras de servidor y cliente (cantidades hasta 3 decimales, costo unitario, campos obligatorios).
- [x] La recepción aumenta stock una sola vez y conserva trazabilidad/auditoría transaccional con advisory locks e idempotencia por `requestId`.
- [x] Permisos `purchases:read` y `purchases:write`, filtros por proveedor/estado/fecha y estados de interfaz (loading, empty, error, restricted) implementados.
- [x] Inmutabilidad de compras recibidas: no se permite editar, borrar ni cancelar compras en estado `RECEIVED`.
- [x] Pruebas automatizadas de schemas, reglas, integración y componentes en verde; typecheck, lint, build y formato pasando.
- [ ] Responsable ejecutó el plan de pruebas manual y aprobó expresamente el incremento.

## Registro

- Fecha de inicio: 24/10/2026.
- Fecha de aprobación: pendiente.
- Aprobado por: pendiente.
- Observaciones: Sprint 17 implementado en rama `feature/sprint-17-purchases`; migración creada y lista para aplicar cuando se autorice; pendiente prueba manual y aprobación expresa del usuario.
