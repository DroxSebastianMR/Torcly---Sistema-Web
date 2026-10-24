# Prompt de implementación - Sprint 19

```text
Implementa exclusivamente Sprint 19 - Asistente IA del dashboard de Torcly.

Lee README.md, acceptance-and-test-plan.md y approval.md del sprint, extension-roadmap.md, definition-of-done, y los módulos dashboard, reports, replenishment, operations, auth, audit e inventory.

Construye un chat de solo lectura con permiso assistant:read. El API debe generar un contexto agregado, mínimo y ya filtrado por permisos; el modelo no tiene acceso a la base de datos ni herramientas mutantes. Incluye período, generatedAt y fuentes en cada respuesta. Si no hay evidencia, debe decirlo.

Diseña AiProvider y GroqProvider en servidor; GROQ_API_KEY solo se lee desde apps/api/.env. Incluye un FakeProvider para pruebas. Maneja proveedor ausente, 429, timeout, límite de tokens y rate limit por usuario con errores seguros. No expongas claves, prompts/respuestas sensibles, PII innecesaria ni datos de módulos no autorizados. No agregues SDK/clave al cliente.

El chat web debe ser accesible, mostrar loading/error/empty/restricted y enlazar al módulo fuente cuando corresponda. Rechaza solicitudes de creación, edición, cancelación, pagos, cambios de inventario o cualquier acción. No ejecutes migraciones ni seed sin autorización. Agrega pruebas y documentación de configuración/costo. Deja approval.md “Listo para prueba del usuario”; no hagas commit ni push.
```
