# Sprint 16 - Seguridad y preparación operativa

Rama objetivo: `feature/sprint-16-security-readiness`  
Base requerida: Sprint 15 implementado  
Historias: HU-83 a HU-85, HU-87, HU-88, HU-91 y HU-92  
Trazabilidad: RNF-04 a RNF-12, RNF-14 a RNF-19 y RNF-27 a RNF-33  
Avance al aprobar: 92/92 = 100,00 %

## Estado

**Implementado; listo para prueba del usuario.** El Sprint 15 sigue con su evidencia manual de rendimiento pendiente; esa excepción no convierte el Sprint 15 en aprobado ni modifica el avance. La implementación del Sprint 16 (API y web) está completa y con typecheck, lint y pruebas verdes; falta la validación manual/operativa y la aprobación expresa.

Implementado:

- HU-83: `GET /health/readiness` sin detalles internos; módulo `maintenance` (señal pública + administración) y aviso en la web. La meta del 98 % sigue requiriendo fuente externa documentada.
- HU-84: recuperación de contraseña completa (respuesta no enumerativa, token almacenado solo como hash, TTL, un solo uso, consumo atómico, invalidación de sesiones y auditoría) con adaptador de comunicación seguro.
- HU-85: bloqueo por intentos y expiración por inactividad (ya en auth) + feedback web de sesión vencida (interceptor 401 → redirección).
- HU-87: consulta administrativa paginada de auditoría (`GET /audit`, `audit:read`) y pantalla admin.
- HU-88: runbook de continuidad en `continuity-runbook.md` (la evidencia de restauración de QA queda pendiente).
- HU-91: mapa de operaciones críticas en `critical-operations-map.md`; pruebas de rollback/idempotencia/concurrencia gated por `DATABASE_TESTS`.
- HU-92: procedencia `generatedAt` en reportes.

Pendiente antes de aprobar: evidencia de restaración QA autorizada, fuente de disponibilidad si se reporta el 98 %, y ejecución de integraciones sobre PostgreSQL descartable.

Documentos de apoyo: `critical-operations-map.md` (HU-91), `continuity-runbook.md` (HU-88).

## Objetivo

Cerrar el backlog actual con controles verificables: sesiones y recuperación de cuenta seguras, permisos y auditoría de accesos sensibles, continuidad documentada, consistencia de operaciones críticas y procedencia suficiente para comprobar indicadores BI y recomendaciones de reabastecimiento.

## Historias incluidas

| Historia | Resultado verificable                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HU-83    | La aplicación expone salud/readiness, comunica mantenimiento planificado y conserva evidencia de disponibilidad; no afirma 98 % sin medición externa.                   |
| HU-84    | Contraseñas, tokens de recuperación, cookies y comunicaciones se tratan sin exponer secretos; la recuperación es de un solo uso y duración limitada.                    |
| HU-85    | Tras los intentos configurados una cuenta se bloquea temporalmente y una sesión inactiva deja de autorizar solicitudes.                                                 |
| HU-87    | Los datos sensibles siguen protegidos por permisos; los accesos y acciones administrativos definidos quedan auditados con actor, cuándo, acción y contexto mínimo.      |
| HU-88    | Existe un procedimiento de respaldo/restauración ejecutable y evidencia de una restauración de QA; el sistema no simula copias ni oculta una dependencia del proveedor. |
| HU-91    | Las mutaciones críticas preservan consistencia, rollback e idempotencia cuando aplica; responsabilidad y límites documentados por módulo.                               |
| HU-92    | Los resultados de BI e IA conservan rango, filtros, versión/fuente y momento de generación suficientes para contrastarlos.                                              |

## Alcance funcional

### Seguridad de acceso

- Revisar y endurecer el ciclo de sesión: cookie HttpOnly, `SameSite`, atributo `Secure` en producción, expiración por inactividad, logout y bloqueo por intentos fallidos sin revelar si una cuenta existe.
- Implementar recuperación completa si falta: solicitud genérica, token aleatorio almacenado solo como hash, caducidad, uso único, invalidación de sesiones previas y auditoría. No enviar contraseñas ni tokens en logs, respuestas, URL persistida ni interfaz.
- Definir un adaptador de comunicación seguro y testeable. Producción exige correo/transporte y HTTPS configurados por infraestructura; no incorporar servicios externos o credenciales reales sin autorización.

### Permisos y auditoría

- Inventariar rutas con PII, auditoría, BI e IA; conservar `requireAuth` y `requirePermission` como autoridad del servidor, aun si la UI oculta acciones.
- Crear consulta administrativa paginada de auditoría solo si es necesaria para demostrar HU-87, con permiso dedicado, filtros seguros y campos mínimos.
- Registrar recuperación, administración y denegación con actor, fecha, evento, `requestId` y metadata permitida; nunca hashes, tokens, contraseñas, cookies, cabeceras de autorización o secretos.

### Continuidad e integridad

- Añadir health/readiness sin detalles internos y una señal de mantenimiento planificado. La meta mensual de 98 % exige fuente externa, período y cálculo documentado.
- Elaborar un runbook de PostgreSQL: respaldo diario, protección/cifrado, retención, ubicación separada, verificación, restauración ensayada, responsables y respuesta a incidentes. Diferenciar desarrollo, QA y producción.
- Auditar el mapa de transacciones, locks e idempotencia de inventario, ventas, taller, pagos y reabastecimiento; probar rollback, reintento y concurrencia con PostgreSQL controlado.

### Procedencia BI e IA

- Verificar que BI preserva período, filtros y momento de generación, y que reabastecimiento conserva estrategia, versión, entradas resumidas y resultados inmutables.
- Añadir solo metadatos faltantes; no duplicar PII para resolver una necesidad analítica.

## Límites no negociables

1. No desactivar autenticación, permisos, CORS, Helmet, validaciones, auditoría o protecciones de sesión para una prueba o demo.
2. No registrar ni devolver contraseñas, hashes, tokens, cookies, Authorization, cuerpos sensibles ni secretos de entorno.
3. No afirmar SLA, TLS o respaldo recuperable sin evidencia verificable del entorno.
4. Restaurar o sobrescribir una base real exige objetivo confirmado y autorización expresa. Las pruebas usan datos descartables.
5. No crear/aplicar migraciones, seed, envíos de correo o cambios de producción sin autorización posterior.
6. La API conserva autoridad de permisos y reglas de negocio; no se altera stock, pagos, ventas, órdenes, BI o IA para cumplir requisitos transversales.

## Fuera de alcance

- Adquirir/configurar servicios externos de monitoreo, correo, secretos, respaldo, WAF, CDN o almacenamiento.
- Certificar formalmente disponibilidad, seguridad o cumplimiento normativo.
- Recuperar cuentas reales, restaurar producción, borrar auditoría o cambiar secretos.
- Funciones comerciales nuevas fuera del backlog de 92 historias.

## Criterios técnicos

- Rutas nuevas: schema validado, autenticación, permiso mínimo, paginación cuando aplique, error uniforme y pruebas de 401/403/entrada inválida.
- Secretos: solo en `apps/api/.env` ignorado por Git; `.env.example` contiene nombres, nunca valores reales. Ninguna variable `VITE_*` contiene secretos.
- Auditoría: append-only, actor/tiempo/contexto mínimo y consultas administrativas autorizadas.
- Recuperación: aleatoriedad criptográfica, hash persistido, TTL, un solo uso, consumo atómico e invalidación de sesiones.
- Integridad: transacciones Prisma, restricciones, idempotencia y pruebas de rollback/concurrencia cuando correspondan.
- Procedencia: reportes y corridas conservan período, filtros, timestamp, fuente y versión/estrategia.

## Dependencias y salida

- Reutiliza auth, auditoría, middleware, transacciones e idempotencia de los Sprints 01 a 15.
- Requiere PostgreSQL controlado para integración/restauración y responsable operativo para validar el runbook.
- Al aprobar las ocho historias, el backlog alcanza **92/92 (100,00 %)**. Esto no equivale a una certificación de seguridad o SLA productivo.

## Evidencia requerida antes de aprobar

- Pruebas unitarias, integración y flujo manual de auth, recuperación, permisos, auditoría y operaciones críticas.
- Configuración revisada sin secretos expuestos, cookies/cabeceras verificadas y registros sanitizados.
- Evidencia de salud/readiness, mantenimiento y una fuente de disponibilidad si se reporta el 98 %.
- Runbook y restauración ensayada sobre entorno autorizado y desechable.
- Matriz de transacciones/idempotencia y procedencia comprobable de BI/IA.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm format:check` y `git diff --check` en verde.
