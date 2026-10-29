# Plan de aceptación y pruebas - Sprint 16

## Estado

**Implementado; listo para prueba del usuario.** Esta guía define la evidencia mínima para HU-83 a HU-85, HU-87, HU-88, HU-91 y HU-92. Correo, respaldo y restauración se prueban únicamente en un entorno autorizado; nunca sobre producción por defecto.

## Resultado de la verificación automatizada

- API: `pnpm --filter @torcly/api typecheck` y `lint` en verde; `pnpm --filter @torcly/api test` → 40 archivos aprobados | 14 omitidos (54); 304 pruebas aprobadas | 109 omitidas (413). Las integraciones se omiten sin `DATABASE_TESTS=true`.
- Web: `pnpm --filter @torcly/web typecheck` y `lint` en verde; `pnpm --filter @torcly/web test` → 73 archivos / 357 pruebas aprobadas; `build` correcto.
- Repositorio: `pnpm format:check` y `git diff --check` sin hallazgos; `prisma validate`/`generate` correctos.
- Pendiente por dependencia externa: ejecución de integraciones con PostgreSQL descartable (`DATABASE_TESTS=true`), restauración de QA autorizada (S16-11) y la fuente de disponibilidad mensual (S16-03).

## Preparación segura

1. Revisar `apps/api/.env` local sin compartirlo ni adjuntarlo como evidencia.
2. Confirmar PostgreSQL de QA descartable; registrar fecha, responsable y host lógico, nunca credenciales.
3. Crear cuentas QA de permiso mínimo, lectura y administración; no reutilizar cuentas personales.
4. Inspeccionar únicamente atributos de cookies y cabeceras; no copiar sus valores.
5. Definir una ventana ficticia/de QA de mantenimiento con inicio, fin, responsable y mensaje esperado.

## Casos de aceptación

| ID     | Historia | Acción                                                                                    | Resultado esperado                                                                                             |
| ------ | -------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| S16-01 | HU-83    | Consultar health/readiness con dependencia de QA disponible/no disponible.                | Estado coherente y sin secretos, URL de BD, usuario ni detalle interno.                                        |
| S16-02 | HU-83    | Configurar/consultar mantenimiento planificado como administrador y navegar como usuario. | Ventana y mensaje comprensibles; no se falsifica disponibilidad.                                               |
| S16-03 | HU-83    | Revisar evidencia de disponibilidad mensual.                                              | Solo declara 98 % con período, fuente/proveedor, cálculo y tratamiento explícito de mantenimiento.             |
| S16-04 | HU-84    | Iniciar sesión y revisar Set-Cookie/cabeceras por entorno.                                | HttpOnly y SameSite; Secure con HTTPS/producción. Ningún secreto en UI, API o logs.                            |
| S16-05 | HU-84    | Solicitar recuperación para identificador existente e inexistente.                        | Misma respuesta pública; auditoría sanitizada; no enumera cuentas.                                             |
| S16-06 | HU-84    | Cambiar la contraseña con token QA y volver a usarlo.                                     | TTL, hash persistido, un uso; reuso rechazado y sesiones previas invalidadas según diseño.                     |
| S16-07 | HU-85    | Enviar clave errónea hasta el límite y después una correcta.                              | Bloqueo temporal sin información sensible hasta expirar/desbloquear según política.                            |
| S16-08 | HU-85    | Dejar sesión inactiva sobre `SESSION_IDLE_MINUTES` y llamar ruta protegida.               | 401, cierre/redirección de web si corresponde y auditoría.                                                     |
| S16-09 | HU-87    | Consultar rutas/pantallas sensibles con cuenta sin permiso y con administradora.          | 403 sin datos para la primera; acceso mínimo para la segunda.                                                  |
| S16-10 | HU-87    | Consultar auditoría, filtrar por fecha/evento/actor si se implementa.                     | Paginación/orden estables y campos permitidos; sin tokens, hashes, contraseñas ni metadata sensible.           |
| S16-11 | HU-88    | Revisar runbook y ejecutar backup/restore sobre base descartable autorizada.              | Copia verificable y restauración con evidencia fechada, responsable, duración y resultado; no toca producción. |
| S16-12 | HU-91    | Provocar error controlado en una mutación crítica y reintentar con la misma clave.        | Rollback íntegro y reintento idempotente sin duplicar stock, saldo o estado.                                   |
| S16-13 | HU-91    | Ejecutar concurrencia de inventario/pagos/taller/reabastecimiento en PostgreSQL QA.       | Restricciones, locks/transacciones y saldos finales consistentes; sin doble efecto.                            |
| S16-14 | HU-92    | Consultar reporte BI y corrida de reabastecimiento existente.                             | Período, filtros, timestamp y fuente/versión/estrategia requeridos para contrastar resultados.                 |
| S16-15 | HU-92    | Comparar resultado histórico con datos posteriores.                                       | Histórico no se recalcula ni reescribe y su procedencia es identificable.                                      |

## Pruebas automatizadas mínimas

- Auth: login válido/erróneo, respuesta no enumerativa, bloqueo, expiración, logout, recuperación, token vencido/reutilizado y revocación.
- Configuración: CORS permitido/denegado, cabeceras, límite JSON, cookie de producción simulada y sanitización de logs/errores.
- Permisos/auditoría: 401, 403, permiso correcto, auditoría append-only y ausencia de secretos.
- Continuidad: health/readiness, contrato de mantenimiento y validación documental del runbook; CI no restaura una base real.
- Integridad: transacciones, rollback, idempotencia y concurrencia, con integración gated por `DATABASE_TESTS`.
- BI/IA: período, filtros, timestamp, versión/estrategia, inmutabilidad e historial.

## Registro de evidencia

Por caso guardar ID, fecha/hora, rama/commit, entorno, actor QA, datos descartables, resultado esperado/observado, `requestId` si aplica y enlaces a capturas o logs sanitizados. Nunca adjuntar `.env`, cookies, tokens, contraseñas, hashes, direcciones completas de BD o exportaciones con datos reales.

## Criterios de cierre

1. Casos aplicables aprobados o desviación aceptada expresamente.
2. Automatizadas verdes e integraciones marcadas según ejecución en PostgreSQL controlado.
3. Evidencia independiente de restauración QA autorizada.
4. Responsable actualiza `approval.md`; solo entonces se declara 92/92.
