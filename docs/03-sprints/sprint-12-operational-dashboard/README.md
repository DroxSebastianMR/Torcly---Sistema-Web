# Sprint 12 - Consulta operativa

Rama objetivo: `feature/sprint-12-operational-dashboard`
Base requerida: Sprint 11 aprobado
Historias: HU-63 a HU-65
Trazabilidad: RF-CON-001 a RF-CON-005
Avance esperado al aprobar: 65/92 = 70,65%

## Estado

**Documentado; no iniciado.** No se implementará código ni se modificará el avance hasta que el usuario complete y apruebe la prueba manual del Sprint 11. Esta documentación solo congela el alcance siguiente.

## Objetivo

Ofrecer una vista operativa de lectura para que el taller consulte, desde un único punto, el estado actual de ventas, cobros, citas, órdenes de taller e inventario, con filtros consistentes y acceso a los detalles existentes. No sustituye los módulos fuente ni incorpora analítica histórica avanzada.

## Historias incluidas

| Historia | Resultado esperado                                                                  |
| -------- | ----------------------------------------------------------------------------------- |
| HU-63    | Consultar un resumen operativo con indicadores actuales y trazables.                |
| HU-64    | Filtrar el resumen por período y estado sin alterar información operacional.        |
| HU-65    | Abrir el detalle del registro origen desde cada alerta, indicador o fila relevante. |

## Alcance funcional

- Una pantalla **Consulta operativa** o dashboard dedicado, protegida por permisos de lectura de los módulos que muestra.
- Indicadores calculados desde fuentes existentes: citas pendientes/programadas, órdenes por etapa, ventas confirmadas, saldos pendientes de cobro e inventario con alerta de stock bajo.
- Filtros de período y estados cuando sean aplicables, con una definición visible y coherente de la fecha usada por cada indicador.
- Listas breves de elementos que requieren atención, con estados de carga, vacío y error; al seleccionar un registro se navega o abre su detalle existente.
- Los datos deben proceder de API y contratos tipados; ningún total se debe inventar, cachear como valor autoritativo ni calcular desde datos incompletos del cliente.
- Toda métrica debe conservar su vínculo con sus fuentes: citas, órdenes, ventas, pagos e inventario.

## Reglas no negociables

1. El Sprint 12 es de **consulta**: no crea, edita, confirma, cobra, entrega ni altera existencias, saldos o estados.
2. Cada indicador declara la fuente, filtro temporal y criterio de inclusión; los montos financieros se derivan en el servidor con el mismo criterio que el módulo de Caja.
3. Los permisos se verifican en API. La interfaz oculta o deshabilita secciones sin permiso, pero no reemplaza la autorización del servidor.
4. Una ausencia de permiso o de datos no se representa como cero engañoso: debe mostrarse un estado de acceso o vacío adecuado.
5. Los enlaces de detalle reutilizan las rutas y pantallas existentes; no duplican reglas de negocio ni exponen UUID internos.
6. No se construyen gráficos de BI, pronósticos, IA, exportaciones ni indicadores sin trazabilidad; eso pertenece a los Sprints 13 y 14.

## Alcance técnico esperado

### API

- Crear un módulo de consulta operativa o endpoints de composición de solo lectura, con schemas, tipos, repositorio, servicio, controller, rutas, README y pruebas.
- Aplicar filtros en servidor, paginar listas de atención y devolver contratos explícitos para indicador, período, estado y enlace de detalle.
- Reutilizar las reglas consolidadas de ventas, pagos, citas, órdenes e inventario; no duplicar mutaciones ni recalcular saldos con lógica distinta.
- Proteger cada sección según el permiso de lectura de su fuente y definir claramente el comportamiento de resultados parciales autorizados.

### Web

- Crear una feature de dashboard operativo con servicio, hooks, tipos, componentes de resumen, filtros y listas de atención.
- Usar formatos existentes de moneda, fecha, estados vacíos/error/carga, controles responsivos y navegación accesible.
- Implementar enlaces o acciones de detalle solo donde el usuario tenga el permiso necesario.

## Fuera de alcance

- Gráficos, comparativas históricas, KPIs de tendencias, exportaciones o inteligencia de negocio.
- Recomendaciones de IA, reabastecimiento automático o modificación de datos.
- Apertura/cierre de caja, facturación, conciliación y métricas fiscales.
- Cambiar reglas de citas, órdenes, inventario, ventas o pagos ya aprobadas.

## Dependencias y salida

- Requiere Sprint 11 aprobado y datos reales de los módulos operativos previos.
- Requiere acceso de lectura a las fuentes usadas en cada indicador.
- Al aprobar, el proyecto pasa de 62/92 a **65/92 historias (70,65%)**.
