# Sprint 14 - Recomendaciones asistidas de reabastecimiento

Rama objetivo: `feature/sprint-14-ai-replenishment`
Base requerida: Sprints 11 a 13 implementados; aprobaciones manuales pendientes conjuntas
Historias: HU-74 a HU-80
Trazabilidad: RF-IA-001 a RF-IA-010
Avance esperado al aprobar: 80/92 = 86,96%

## Estado

**Aprobado y cerrado por autorización del usuario el 16 oct. 2026.** Módulo API `replenishment` completo (schemas, rules, repository, service, controller, routes, tipos, README y pruebas) y feature web `replenishment` (tipos, utils, forms, services, hooks, componentes, página, tests y README). La migración `20261020000000_add_replenishment` fue aplicada en la base de desarrollo configurada; la estrategia v1 es determinista (`net-confirmed-demand-v1`). Se conserva el plan de aceptación para evidencia manual complementaria.

## Objetivo

Generar recomendaciones asistidas y explicables para reabastecer productos, usando exclusivamente historial real de movimientos confirmados y ventas/consumos válidos. La recomendación orienta al usuario: nunca crea compras, entradas, ajustes ni modifica stock automáticamente.

## Historias incluidas

| Historias | Resultado esperado                                                                           |
| --------- | -------------------------------------------------------------------------------------------- |
| HU-74     | Evaluar elegibilidad de productos según historial y calidad de datos.                        |
| HU-75     | Calcular una recomendación de cantidad y prioridad a partir de demanda histórica confirmada. |
| HU-76     | Explicar los datos, período, fórmula y razones de cada recomendación.                        |
| HU-77     | Conservar ejecuciones, versión de criterio y resultados reproducibles.                       |
| HU-78     | Consultar, filtrar y comparar recomendaciones sin modificar operaciones.                     |
| HU-79     | Aplicar permisos de lectura/ejecución y auditoría de cada corrida.                           |
| HU-80     | Gestionar estados de datos insuficientes, errores y revisión manual.                         |

## Alcance funcional

- Pantalla de **Reabastecimiento asistido** con ejecución explícita, período configurable, estado de elegibilidad y lista de recomendaciones.
- Productos elegibles requieren historial confirmado suficiente dentro del período; los no elegibles explican el motivo, por ejemplo, sin movimientos, datos insuficientes o producto inactivo.
- Para cada producto: stock actual, mínimo, demanda confirmada, cobertura estimada, cantidad sugerida, prioridad y explicación de la regla/versionado utilizados.
- Historial de ejecuciones con fecha, actor, período, versión del criterio y resultados; se puede consultar una ejecución anterior sin recalcularla.
- La recomendación puede derivar una lista para revisión, pero no ejecuta compra, entrada ni ajuste de inventario.

## Reglas no negociables

1. Es una ayuda de decisión, no una automatización de inventario. Solo una acción posterior, fuera de este sprint, podrá registrar entradas tras revisión humana.
2. Solo se consumen movimientos de inventario `CONFIRMED`, ventas confirmadas y consumos de órdenes válidos; nunca borradores, cancelados ni datos simulados.
3. Cada ejecución es inmutable, auditable y versionada. Una consulta posterior devuelve el resultado guardado, no un recálculo silencioso.
4. La cantidad sugerida, prioridad y elegibilidad deben ser explicables con entradas, período y fórmula visibles; no se presentan como predicción garantizada.
5. La API determina permisos y elegibilidad. La web no habilita ejecutar sin `inventory:write` y no sustituye la autorización de servidor.
6. No se envían datos operativos a proveedores externos de IA sin una autorización, contrato y evaluación de privacidad explícitos. La primera versión usa una regla determinista, versionada y verificable.

## Alcance técnico esperado

### API y persistencia

- Crear módulo `replenishment` con schemas, rules, repository, service, controller, routes, tipos, README y pruebas.
- Agregar migración nueva para ejecuciones y recomendaciones inmutables, con versión de estrategia, período, actor, criterio, entradas resumidas y auditoría; no modificar migraciones existentes.
- Definir una estrategia inicial determinista, por ejemplo demanda neta diaria confirmada × cobertura objetivo menos stock actual, con redondeo por unidad y prioridad calculada; documentar su versión estable.
- Endpoints protegidos para elegibilidad/listado/detalle y ejecución explícita, paginados y filtrados en servidor.

### Web

- Crear feature `replenishment` con resumen de elegibilidad, formulario de ejecución, lista de resultados, explicación por producto, detalle de corrida e historial.
- Reutilizar formatos, filtros, estados loading/empty/error, guardas de permisos y controles accesibles del proyecto.
- Mostrar advertencias de datos insuficientes y que ninguna acción altera stock o crea compras.

## Fuera de alcance

- Compras automáticas, órdenes de compra, entradas/ajustes de inventario automáticos o modificación de mínimos.
- Modelos externos, LLM, entrenamiento con datos de usuarios, pronósticos opacos o integración con proveedores de IA.
- Exportación, notificaciones automáticas, proveedores, costos de compra y conciliación.

## Dependencias y salida

- Depende de inventario confirmado, ventas confirmadas y consumos de órdenes de Sprints 07–10; usa BI solo como consulta de contraste, no como fuente autoritativa.
- Requiere permisos `inventory:read` para consultar y `inventory:write` para ejecutar una corrida; cualquier permiso adicional se documentará en la matriz.
- Al aprobar, el proyecto pasa de 73/92 a **80/92 historias (86,96%)**.
