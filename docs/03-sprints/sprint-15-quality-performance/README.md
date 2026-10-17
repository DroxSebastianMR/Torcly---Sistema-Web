# Sprint 15 - Calidad, rendimiento y experiencia transversal

Rama objetivo: `feature/sprint-15-quality-performance`  
Base requerida: Sprint 14 cerrado  
Historias: HU-81, HU-82, HU-86, HU-89 y HU-90  
Trazabilidad: RNF-01 a RNF-03, RNF-13 y RNF-20 a RNF-26  
Avance al aprobar: 85/92 = 92,39%

## Estado

**Implementado; listo para prueba del usuario.** El código, los tests automatizados y la
documentación de medición están completos y en verde. No hay aprobación ni cambio de
avance: el acumulado sigue en 80/92 historias aprobadas (86,96%) hasta la prueba manual
expresa del responsable. Los resultados de tiempo (3 s / 5 s) deben medirse con la guía
reproducible antes de declarar cumplidas HU-81 y HU-82.

## Implementación del Sprint 15

- **Instrumentación de API**: middleware de duración con ruta normalizada
  (`shared/observability/normalize-route.ts`); el evento `http_request_completed` y el
  log de transacción de `prisma.service` exponen solo `requestId`, `module`, `operation`,
  `method`, `route`, `status` y `durationMs`. `metrics` normaliza el `path` reportado por
  la web. Tests: `apps/api/tests/request-timing.test.ts` (7).
- **Validación cliente-servidor**: se verificaron límites estrictos en schemas Zod de
  operaciones mutables prioritarias (pagos y ventas); sin cambios de negocio.
- **Formularios web**: el modal de venta conserva el formulario ante un rechazo del
  servidor y no se cierra; test en `sale-form-modal.test.tsx`.
- **Medición de carga de módulos**: `navigation/utils/module-load-metrics.ts` envía a un
  endpoint interno sin terceros ni bloquear navegación; test dedicado (3).
- **Responsive y teclado**: tarjetas móviles en tablas de reabastecimiento, órdenes,
  citas y ventas; acciones accesibles por fila (`aria-label` + `stopPropagation`);
  `smart-select` maneja `Escape`, `ArrowDown`/`Enter` y restaura el foco al trigger;
  stock bajo con icono y texto (color no es la única señal).
- **Estados del Dashboard**: loading con `role="status"`, estado vacío con `EmptyState`
  y error con reintento, incluida la carga de atención por sección.
- **Documentación**: `measurement-guide.md` describe el método repetible de medición.

## Objetivo

Consolidar la calidad transversal de Torcly: validar datos antes de persistirlos, medir tiempos reales de operaciones habituales y BI, mejorar la claridad de acciones y errores críticos, y comprobar el uso en laptop, tablet y navegadores modernos.

## Historias incluidas

| Historia | Resultado verificable                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| HU-81    | Las operaciones habituales objetivo responden en hasta tres segundos bajo las condiciones documentadas de prueba. |
| HU-82    | Reportes e indicadores BI aprobados responden en hasta cinco segundos bajo las condiciones documentadas.          |
| HU-86    | Los formularios y la API validan entradas inválidas antes de crear o alterar datos.                               |
| HU-89    | Mensajes, etiquetas, confirmaciones de acciones críticas y estados de error son coherentes y comprensibles.       |
| HU-90    | Los flujos principales funcionan en laptop, tablet y navegadores modernos definidos.                              |

## Alcance funcional

- Definir y automatizar una base reproducible de medición para operaciones frecuentes: autenticación, consultas de módulos, creación de clientes, vehículos, productos y citas, y consultas de caja/taller.
- Usar los eventos de tiempo de API (`http_request_completed`, `requestId`, `module`, `operation`, `durationMs`) para correlacionar la acción con su respuesta sin registrar contraseñas, tokens ni cuerpos sensibles.
- Medir la carga de los reportes BI y dejar visible el período, escenario y resultado de la medición; no presentar un valor local como garantía universal.
- Auditar y completar validación cliente-servidor, incluyendo mensajes accionables, prevención de duplicados, valores numéricos inválidos y conservación del formulario ante un error.
- Normalizar los textos de confirmación para acciones irreversibles o críticas y los estados loading, empty, error y restricted en los flujos revisados.
- Validar navegación por teclado, foco visible, etiquetas accesibles y diseños principales a 1280 px (laptop) y 768 px (tablet), en Chrome y Edge actuales; Firefox actual se registra como contraste cuando esté disponible.

## Límites no negociables

1. Una medición no sustituye una prueba funcional: se verifican resultado, persistencia y autorización además del tiempo.
2. No se declaran cumplidos los límites de 3 s o 5 s sin escenario, datos, fecha, navegador, red/local y evidencia del resultado.
3. No se registran secretos, contraseñas, cookies, tokens, documentos completos ni cuerpos de solicitud en telemetría o evidencias.
4. La web conserva validación útil, pero la API sigue siendo la autoridad para validación, autenticación y permisos.
5. El trabajo de rendimiento no cambia reglas de negocio, saldos, stock, órdenes ni pagos para obtener una medición mejor.
6. No se introducen servicios externos de analítica, rastreo o monitoreo sin autorización expresa.

## Criterios técnicos

- Inventariar las rutas y formularios objetivo; cada medición debe asociar acción, módulo, `requestId`, estado HTTP y `durationMs`.
- Usar pruebas unitarias/integración para reglas deterministas; evitar tests de tiempo frágiles que fallen por variaciones normales del equipo.
- Si se optimiza una consulta, preservar filtros, paginación, permisos, orden y contrato de respuesta; respaldarlo con pruebas de regresión.
- Definir umbrales de UI separados de los de API y documentar si una medición incluye renderizado, red o solo respuesta de servidor.
- Mantener estados accesibles y responsive sin ocultar acciones necesarias detrás de color, hover o un icono sin nombre.

## Fuera de alcance

- Cambios de negocio de ventas, inventario, citas, taller, pagos, BI o reabastecimiento.
- Un SLA productivo, monitoreo externo, pruebas de carga masiva en infraestructura ajena o cambios de proveedor de base de datos.
- Nuevas funciones de seguridad profunda, respaldo o recuperación: pertenecen al Sprint 16.

## Dependencias y salida

- Reutiliza los flujos integrados de los Sprints 01 a 14 y el registro de tiempo de API ya existente como línea base.
- Requiere datos de desarrollo y una sesión con permisos adecuados para medir operaciones mutables de manera controlada.
- Al aprobar, el proyecto avanza a **85/92 historias (92,39%)**. La evidencia manual no se sustituye por los tests automatizados.

## Verificación ejecutada

| Comando                             | Resultado                                                 |
| ----------------------------------- | --------------------------------------------------------- |
| API `typecheck`                     | Sin errores (`prisma generate` + `tsc --noEmit`).         |
| API `lint`                          | Sin errores.                                              |
| API `db:validate`                   | `El schema es válido`.                                    |
| API `test`                          | 286 aprobados, 107 omitidos (integración sin PostgreSQL). |
| Web `typecheck` / `lint`            | Sin errores.                                              |
| Web `test`                          | 347 aprobados en 70 archivos.                             |
| Web `build`                         | Compilado correctamente.                                  |
| `format:check` / `git diff --check` | Sin problemas de formato ni de espacios.                  |

Las pruebas de integración del API (`DATABASE_TESTS`) quedan omitidas mientras no haya
PostgreSQL disponible; deben re-ejecutarse antes de la aprobación final.
