# Hoja de ruta al 31,52%

## Métrica acordada

El porcentaje se calcula por historias aprobadas del Product Backlog: `historias aprobadas / 92 × 100`. No se asigna avance parcial a una historia. Las tareas técnicas habilitadoras forman parte de la historia que soportan.

| Sprint | Alcance                                      |             Historias nuevas | Acumulado | Porcentaje |
| ------ | -------------------------------------------- | ---------------------------: | --------: | ---------: |
| 01     | Fundaciones de datos, autenticación y sesión |                HU-01 a HU-02 |         2 |      2,17% |
| 02     | Usuarios, roles y estado de cuenta           |                HU-03 a HU-06 |         6 |      6,52% |
| 03     | Gestión de clientes                          |                HU-07 a HU-10 |        10 |     10,87% |
| 04     | Gestión de vehículos                         |                HU-11 a HU-14 |        14 |     15,22% |
| 05     | Catálogo de productos                        |                HU-15 a HU-18 |        18 |     19,57% |
| 06     | Inventario y catálogo de servicios           | HU-19 a HU-24, HU-58 a HU-62 |        29 |     31,52% |

## Orden y dependencias

`datos y sesión → usuarios/permisos → clientes → vehículos → productos → inventario y servicios`

La secuencia protege integridad y reutiliza patrones de formularios, tablas, búsqueda, estados y errores. Sprint 06 reúne inventario y servicios porque ambos dependen del catálogo y son la base directa de citas, taller, ventas, BI e IA.

## Condiciones para intentar la meta esta semana

- alcance congelado a las historias listadas;
- datos de prueba anonimizados;
- revisión del usuario al cierre de cada sprint;
- correcciones del sprint antes de abrir el siguiente;
- ningún commit ni push sin autorización expresa;
- si la validación se demora, la fecha se mueve: no se declara aprobado el trabajo pendiente.

## Lo que queda después del 31,52%

Citas, operaciones de taller, ventas, pagos, consulta operativa, BI, IA y requisitos no funcionales de despliegue siguen pendientes. La siguiente fase debe priorizar el flujo `cita → operación → consumo → venta → pago` antes de construir dashboards o recomendaciones.
