# Plan de aceptación - Sprint 12 Consulta operativa

## Estado

Planificado. Se ejecutará cuando Sprint 11 esté aprobado y exista una semilla o conjunto de datos conocido con citas, órdenes, ventas confirmadas, pagos e inventario.

## Preparación

1. Confirmar que Sprint 11 tiene aprobación registrada y que sus migraciones están aplicadas en el entorno de prueba.
2. Iniciar sesión con un usuario que tenga permisos de lectura de citas, taller, ventas, caja e inventario.
3. Contar con datos que representen al menos una cita, una orden de taller, una venta confirmada, una obligación pendiente y un producto con alerta de stock.

## Casos principales

| Caso         | Acción                                                           | Resultado esperado                                                               |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Resumen      | Abrir Consulta operativa sin filtros.                            | Los indicadores coinciden con los datos de los módulos fuente.                   |
| Período      | Cambiar el rango de fechas.                                      | Solo cambian las métricas definidas por fecha; se muestra el período aplicado.   |
| Estados      | Filtrar citas, órdenes o pagos por estado.                       | Las listas e indicadores usan el mismo criterio de inclusión.                    |
| Alertas      | Revisar órdenes pendientes, saldos pendientes e inventario bajo. | Cada elemento indica su origen y estado real; no muestra UUIDs internos.         |
| Detalle      | Abrir un elemento de cada lista.                                 | Se abre la ficha existente correcta, conservando permisos y contexto.            |
| Sin datos    | Aplicar un rango sin coincidencias.                              | Se muestra estado vacío claro, sin cifras inventadas.                            |
| Error        | Simular un error de API.                                         | Se muestra estado de error recuperable sin ocultar como cero los datos fallidos. |
| Permisos     | Probar con un usuario sin una o más lecturas.                    | La API no entrega datos no autorizados y la UI explica o limita esa sección.     |
| Solo lectura | Inspeccionar la interacción y la red.                            | No hay acciones que modifiquen estados, pagos, inventario ni registros.          |

## Evidencia mínima

- Captura del resumen con período visible y datos trazables.
- Comparación de cada indicador con la página fuente correspondiente.
- Navegación correcta desde alertas a cita, orden, venta, pago o producto.
- Estados de vacío, error y permiso restringido.
- Resultado de pruebas, typecheck, lint, build, formato y `git diff --check`.
