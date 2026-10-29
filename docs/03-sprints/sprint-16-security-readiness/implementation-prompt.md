# Prompt de implementación - Sprint 16

```text
Implementa el Sprint 16 - Seguridad y preparación operativa en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Rama: feature/sprint-16-security-readiness.
- Sprint 15 está implementado y su evidencia manual de rendimiento continúa pendiente. La autorización de este Sprint 16 no marca el Sprint 15 como aprobado.
- Antes de cambiar código, lee por completo:
  - docs/03-sprints/sprint-16-security-readiness/README.md
  - docs/03-sprints/sprint-16-security-readiness/acceptance-and-test-plan.md
  - docs/03-sprints/sprint-16-security-readiness/approval.md
  - docs/04-calidad/definition-of-done.md
  - docs/04-calidad/traceability.md
  - apps/api/src/config/env.ts, app.ts, server.ts y módulos auth, users, reports, replenishment, inventory, payments y work-orders.

Objetivo:
Implementa HU-83 a HU-85, HU-87, HU-88, HU-91 y HU-92 / RNF-04 a RNF-12, RNF-14 a RNF-19 y RNF-27 a RNF-33. El 100 % requiere prueba manual, evidencia operativa y aprobación expresa.

Decisiones obligatorias:
1. No falsees un 98 % de disponibilidad: health/readiness o una ventana de mantenimiento no demuestran SLA. Exige fuente externa/proveedor, período y cálculo para declararlo.
2. No desactives autenticación, permisos, CORS, Helmet, validación, auditoría ni cookies/sesiones para demos o pruebas.
3. Nunca registres/devuelvas contraseñas, hashes, tokens, cookies, Authorization, secretos, cuerpos sensibles ni DATABASE_URL.
4. El API es la autoridad: schema validado, autenticación y permiso mínimo por endpoint; la UI no reemplaza guards.
5. Si falta recuperación de contraseña, usa respuesta no enumerativa, token criptográfico almacenado solo como hash, TTL, un uso, consumo atómico, invalidación de sesiones y auditoría sanitizada. No envíes correo ni uses terceros sin autorización; usa adaptador testeable.
6. Solo crea consulta administrativa de auditoría si es necesaria para HU-87. Debe ser paginada, con permiso dedicado, orden estable y campos mínimos; auditoría append-only sin metadata sensible.
7. HU-88 se cubre con runbook y restauración real de QA autorizada, no con una falsa copia interna. No ejecutes pg_dump, restore, migración, seed ni toques una base real sin autorización expresa y objetivo confirmado.
8. Para HU-91 reutiliza transacciones Prisma, restricciones, locks e idempotencia existentes; no cambies reglas comerciales para pasar tests.
9. Para HU-92 conserva procedencia mínima: período, filtros, timestamp, fuente, estrategia/versión e inmutabilidad de históricos; evita duplicar PII.
10. HTTPS es un requisito de despliegue documentado. La app local no afirma TLS si el proxy/hosting no lo configura.

API y datos:
- Revisa primero auth existente (bloqueo, expiración, sesiones hasheadas, cookies y eventos) y completa brechas sin duplicar lógica.
- Implementa health/readiness y mantenimiento sin detalles internos ni secretos.
- Si se requieren tablas (tokens de recuperación o mantenimiento), crea migración nueva sin editar las existentes. No la apliques ni ejecutes seed sin autorización.
- Protege administración y conserva errores/requestId/logs sanitizados.
- Añade pruebas unitarias e integración gated para 401/403, bloqueo, inactividad, recuperación, auditoría, health/readiness, rollback, reintento y concurrencia con datos descartables.

Web:
- Implementa solo pantallas necesarias: recuperación/restablecimiento, mantenimiento, feedback de sesión expirada y auditoría administrativa si corresponde.
- No muestres tokens o secretos. Trata URL de recuperación coxmo transitoria y navega de forma segura tras el consumo.
- Respeta permisos, accesibilidad, foco y estados loading/empty/error/restricted.

Operación y documentación:
- Crea/actualiza runbook de continuidad: respaldo diario, protección/cifrado, retención, ubicación separada, verificación, restauración, responsables, RPO/RTO propuestos e incidente; separa desarrollo, QA y producción e indica controles del proveedor.
- Documenta mapa de operaciones críticas y sus controles de transacción, idempotencia, locks/restricciones y auditoría.
- Actualiza READMEs de módulos y documentos de Sprint 16 con resultados reales. Deja approval.md como “Listo para prueba del usuario”; no declares aprobación ni 100 %.

Calidad:
- Ejecuta API typecheck/lint/tests/prisma validate y las integraciones con PostgreSQL QA; web typecheck/lint/tests/build; format:check y git diff --check.
- No hagas commit ni push. No incluyas, borres ni modifiques .playwright-cli/, .playwright-mcp/, output/ ni tmp/.
```
