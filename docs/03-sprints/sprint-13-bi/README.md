# Sprint 13 - Inteligencia de negocio

Rama objetivo: `feature/sprint-13-bi`
Base requerida: Sprints 11 y 12 implementados; aprobación manual pendiente conjunta
Historias: HU-66 a HU-73
Trazabilidad: RF-BI-001 a RF-BI-009
Avance esperado al aprobar: 73/92 = 79,35%

## Estado

**Listo para prueba del usuario.** La excepción autorizada permitió implementar el Sprint 13 antes del cierre manual de los Sprints 11 y 12. El avance permanece en 70/92 hasta la aprobación conjunta expresa; al aprobar sube a **73/92 (79,35%)**.

## Objetivo

Entregar indicadores históricos y trazables para inventario, ventas, cobros, servicios y órdenes de taller. BI consume datos reales de los módulos fuente; no los corrige, completa ni modifica.

## Historias incluidas

| Historias     | Resultado esperado                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------- |
| HU-66 a HU-67 | Indicadores y tendencia de ventas confirmadas, importe y composición por producto/servicio.        |
| HU-68 a HU-69 | Indicadores de cobro: saldo pendiente, cobrado y estado de obligaciones.                           |
| HU-70         | Indicadores de inventario: stock bajo y movimientos confirmados.                                   |
| HU-71 a HU-72 | Indicadores de operación: citas y órdenes por etapa, tiempos y entregas cuando exista información. |
| HU-73         | Filtros temporales, permisos, detalle trazable y estados de consulta confiables.                   |

## Alcance funcional

- Página **Reportes** con período obligatorio o predefinido, indicadores, series temporales y tablas de desglose.
- Métricas calculadas por API desde ventas confirmadas, pagos/compensaciones, movimientos confirmados, citas y órdenes existentes.
- Drill-down hacia los módulos fuente, conservando permiso y sin UUIDs visibles.
- Exportación, pronósticos, IA, metas editables y conciliación financiera quedan fuera de alcance.

## Reglas no negociables

1. BI es solo lectura: no crea ventas, pagos, inventario, citas ni órdenes.
2. Cada métrica identifica período, fuente, estados incluidos y criterio de cálculo.
3. Los saldos reutilizan el cálculo de `payments`; stock reutiliza movimientos confirmados; nunca se recalculan con reglas paralelas del cliente.
4. La API verifica permisos de lectura por bloque. Datos restringidos no se convierten en cero ni se filtran al navegador.
5. Los gráficos deben tener alternativa tabular, etiquetas y valores accesibles.
6. No se agregan datos simulados ni migraciones salvo necesidad aprobada expresamente.

## Alcance técnico esperado

### API

- Módulo `reports` de solo lectura con rutas `GET /reports/summary` y `GET /reports/blocks/:block`, ambas con `from`/`to` opcionales; esquema, tipos, repositorio, servicio, controller, rutas, README y pruebas.
- Período resuelto en servidor: `to` ausente = hoy, `from` ausente = `to − 30 días`, rango invertido → `400 REPORTS_DATE_RANGE_INVALID`; granularidad de series diaria (≤31 días), semanal (≤186) o mensual (≥187) con claves `YYYY-MM-DD`, lunes ISO o `YYYY-MM`.
- Bloques: `sales`, `payments`, `inventory`, `services` y `workshop`, cada uno protegido por `requirePermission` de su fuente además de `reports:read`.
- Saldos y stock reutilizan las reglas de `payments` e `inventory`; no se recalculan con lógica paralela.

### Web

- Feature `reports` con servicios, hooks (`useReportSummary`/`useReportBlock`), tipos, formatters, componentes (`IndicatorCard`, `BarChart` accesible con tabla equivalente, `ReportTable`, `BlockCard`, `PeriodToolbar`) y bloques por módulo.
- Página `Reportes` reemplaza el placeholder: período con predefinido “Últimos 30 días”, bloques autorizados en grilla, estados de carga/no datos/403/error y enlaces de drill-down a los módulos fuente.
- Permisos: los bloques sin lectura no se consultan ni se muestran como cero.

## Fuera de alcance

- Exportación, pronósticos, IA, metas editables, conciliación financiera y comparativas fiscales.
- Corrección, completado o mutación de datos de origen; BI es solo lectura.
- Cambiar reglas consolidadas de ventas, pagos, citas, órdenes, inventario o servicios.

## Dependencias y salida

- Datos reales de Sprints 07 a 12; en particular ventas confirmadas, pagos, inventario y órdenes.
- Permisos de lectura de ventas, caja, inventario, servicios y taller según cada bloque.
- Al aprobar junto con los sprints previos, el proyecto alcanza **73/92 (79,35%)**.

## Implementación y verificación

- API: módulo `reports` con resumen y bloques en `/api/v1/reports`; períodos y granularidades consistentes, permisos por bloque, saldos desde `payments` y stock desde movimientos confirmados.
- Web: página `Reportes` con período, indicadores, series temporales accesibles y desgloses trazables por bloques autorizados.
- Verificado: API 256 pruebas correctas (101 integración gated, incluye 6 de reports), typecheck y lint; web 305 pruebas en 63 archivos (15 de reports) y typecheck, lint y build; `format:check` y `git diff --check` en verde.
