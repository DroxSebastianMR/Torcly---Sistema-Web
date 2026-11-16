# Sprint 37: Estándar de estados de carga

## Objetivo

Unificar los estados de carga de Torcly para que cada módulo represente su
estructura real con skeletons, sin textos genéricos, saltos visuales ni tablas
vacías mientras llegan los datos.

## Historias de usuario

- Como usuario, quiero ver el esqueleto de la tabla de cotizaciones mientras
  consulta datos para entender que el sistema sigue trabajando.
- Como usuario, quiero que el Dashboard conserve su jerarquía visual mientras
  carga sus KPIs y paneles.
- Como equipo, queremos una primitiva reutilizable para filas y KPIs de carga.

## Alcance

- Auditoría de páginas operativas y sus tablas.
- Componente UI reutilizable para skeletons de tablas y métricas.
- Integración prioritaria en Cotizaciones y Dashboard.
- Registro de cobertura y deuda restante por módulo.

## Resultado de la auditoría por módulo

| Módulo | Estado de carga | Acción Sprint 37 |
| --- | --- | --- |
| Dashboard | Existía, pero era genérico | Refinado con la forma de encabezado, KPIs y paneles. |
| Cotizaciones | La tabla ignoraba `loading` | Skeleton de tabla integrado. |
| Clientes, productos, citas, órdenes | Skeleton de tabla propio | Verificado, sin cambio funcional. |
| Inventario, caja, compras | Skeleton de tabla o detalle propio | Verificado, sin cambio funcional. |
| Mantenimiento preventivo, notificaciones, auditoría | Skeleton propio | Verificado, sin cambio funcional. |
| Perfil y asistentes | Estado de carga específico de vista | Verificado, sin cambio funcional. |

La deuda restante no es de cobertura: algunos módulos aún tienen skeletons
locales. Podrán migrarse gradualmente a la primitiva común sin cambiar su UX.
