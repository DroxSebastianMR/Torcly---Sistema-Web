# Prompt de implementación - Sprint 15

```text
Implementa el Sprint 15 - Calidad, rendimiento y experiencia transversal en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Rama de trabajo: feature/sprint-15-quality-performance.
- Antes de cambiar código, lee completamente:
  - docs/03-sprints/sprint-15-quality-performance/README.md
  - docs/03-sprints/sprint-15-quality-performance/acceptance-and-test-plan.md
  - docs/03-sprints/sprint-15-quality-performance/approval.md
  - docs/04-calidad/definition-of-done.md
  - docs/04-calidad/traceability.md
  - los middleware de API, auth, formularios compartidos, layouts, Dashboard, Reports y módulos mutables.

Objetivo:
Implementa HU-81, HU-82, HU-86, HU-89 y HU-90 / RNF-01 a RNF-03, RNF-13 y RNF-20 a RNF-26. Al aprobar, el acumulado será 85/92 = 92,39%.

Decisiones obligatorias:
1. Mide, no simules. Toda afirmación de rendimiento debe indicar escenario, fuente de datos, entorno y unidad. No codifiques delays ni valores ficticios para aparentar rapidez.
2. Conserva la autoridad del servidor: validación de formularios en web mejora experiencia, pero API valida tipos, negocio, autenticación y permisos.
3. Los logs de rendimiento deben contener solo metadatos técnicos permitidos: requestId, módulo, operación, método, ruta normalizada, estado y durationMs. Nunca contraseñas, cookies, tokens, cabeceras de autorización, cuerpos sensibles ni documentos completos.
4. Los límites son hasta 3 s para operaciones habituales y hasta 5 s para BI en las condiciones del plan de aceptación. No los presentes como SLA de producción ni uses tests temporales frágiles como único criterio.
5. No cambies reglas de negocio, saldos, stock, pagos, órdenes o permisos para mejorar una medición. Si optimizas una consulta, preserva contrato, filtros, orden, paginación y controles.
6. Las confirmaciones críticas deben indicar qué pasará y permitir cancelar sin mutar. Los estados loading, empty, error y restricted deben ser comprensibles y accesibles.
7. Respeta laptop/tablet y navegación por teclado; no uses color, hover o iconos sin nombre como única forma de comunicar estado o acción.

Trabajo API:
- Audita la instrumentación existente de duración por request y completa rutas/operaciones faltantes con logs estructurados y seguros.
- Identifica consultas frecuentes y de BI; aplica optimizaciones justificadas, con pruebas de regresión y sin N+1, lecturas duplicadas o recálculos evitables.
- Revisa schemas de Zod y respuestas de error en operaciones mutables prioritarias. Cubre cliente inválido, duplicado, límites, permiso y error de dependencia cuando corresponda.
- Agrega pruebas unitarias e integración para el contrato, permisos, validación y ausencia de datos sensibles en los logs. No dependas de un tiempo de CPU exacto en CI.

Trabajo web:
- Audita los formularios y diálogos prioritarios: login, cliente, vehículo, producto, inventario, venta, cita, orden, pago y reabastecimiento.
- Unifica mensajes, validaciones, confirmaciones y recuperación de errores siguiendo los componentes/patrones existentes; conserva valores ingresados cuando el servidor rechace la operación.
- Implementa o completa medición de experiencia de carga de módulos sin enviar telemetría a terceros y sin bloquear navegación.
- Revisa responsive y teclado de rutas/diálogos objetivo a 1280 px y 768 px; añade tests donde sean deterministas.

Calidad y documentación:
- Documenta escenario, método y límites de las mediciones; proporciona una guía repetible, no números absolutos inventados.
- Ejecuta API typecheck/lint/tests/prisma validate; web typecheck/lint/tests/build; format:check y git diff --check.
- Actualiza README de los módulos y los documentos del Sprint 15 con resultados reales. Deja approval.md como “Listo para prueba del usuario”; no declares aprobación ni cambies el avance sin prueba manual y autorización expresa.
- No incluyas, borres ni modifiques .playwright-cli/, .playwright-mcp/, output/ ni tmp/. No hagas commit ni push.
```
