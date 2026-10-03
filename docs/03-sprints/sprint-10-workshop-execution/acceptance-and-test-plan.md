# Plan de aceptación - Sprint 10 Ejecución, consumo y entrega

## Estado

Implementación completada con verificación automatizada en verde (API 190 unitarios + 87 de integración gated, web 286 tests, typecheck, lint, build, formato y `git diff --check`). **Pendiente de prueba manual y aprobación del usuario.**

## Preparación

1. Aplicar las migraciones del Sprint 10 y ejecutar la semilla solo cuando el incremento esté listo para probar.
2. Iniciar sesión como administrador y confirmar acceso a **Órdenes de taller**, **Inventario** y **Vehículos**.
3. Tener una orden `APROBADA` con técnico asignado, diagnóstico y presupuesto enviado. El presupuesto debe incluir al menos un producto con stock disponible y un servicio.

## Datos de prueba sugeridos

| Dato                   | Valor sugerido                                                                |
| ---------------------- | ----------------------------------------------------------------------------- |
| Orden                  | OT-000001 aprobada de Prueba Natural Sprint03 / ABC123 - Toyota Corolla Cross |
| Técnico                | Arian                                                                         |
| Producto presupuestado | Filtro de aceite Mann W 712/83, presupuesto de 1 und, stock disponible        |
| Servicio presupuestado | Mantenimiento preventivo                                                      |
| Actividad 1            | Reemplazar filtro de aceite y verificar nivel de lubricante.                  |
| Actividad 2            | Revisar pastillas, discos y nivel de líquido de frenos.                       |
| Observación de entrega | Vehículo entregado; se explicó al cliente el mantenimiento realizado.         |

Sustituye los datos si la orden o artículos no existen. El producto debe estar activo y contar con existencia suficiente.

## Casos principales

| Caso                 | Acción                                                                                     | Resultado esperado                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Inicio               | Abrir una orden aprobada con técnico y usar **Iniciar ejecución**.                         | Cambia a `EN_EJECUCION` y registra responsable y fecha de inicio.                              |
| Requisito de técnico | Intentar iniciar una orden aprobada sin técnico.                                           | La interfaz y API rechazan la transición e informan el motivo.                                 |
| Actividades          | Registrar las dos actividades sugeridas y completar ambas.                                 | Se muestran en cronología con responsable, fechas y estado; el avance se actualiza.            |
| Consumo              | Anotar el stock inicial del filtro; consumir 1 und desde su línea presupuestada.           | Se registra el consumo y una única salida `EXIT` asociada a la orden; el stock disminuye en 1. |
| Idempotencia         | Reintentar la misma acción de consumo o enviar dos solicitudes concurrentes.               | Se conserva un único movimiento para esa cantidad; no descuenta dos veces.                     |
| Límite               | Intentar consumir más de lo presupuestado o más de lo disponible.                          | Se rechaza, no crea movimiento y el stock permanece correcto.                                  |
| Devolución           | Devolver la unidad consumida y verificar inventario.                                       | Crea una compensación `ADJUSTMENT_IN`; aumenta el stock sin borrar la salida original.         |
| Nuevo consumo        | Consumir nuevamente la unidad devuelta.                                                    | Se permite una salida nueva dentro del máximo presupuestado.                                   |
| Finalización         | Con actividades completas y consumo registrado, usar **Finalizar trabajo**.                | Estado `LISTA_PARA_ENTREGA`; ya no permite nuevas actividades o consumos.                      |
| Entrega              | Registrar la entrega con la observación sugerida.                                          | Estado `ENTREGADA`, fecha/responsable/observación visibles; no registra pago.                  |
| Inmutabilidad        | Intentar consumir, devolver o modificar actividades después de entregar.                   | La API rechaza la acción y la UI no muestra controles inválidos.                               |
| Historial            | Abrir el vehículo ABC123 y su historial de mantenimiento.                                  | Aparece la orden entregada con diagnóstico, técnico, actividades y repuestos consumidos.       |
| Consulta             | Buscar y filtrar órdenes por código, placa, técnico y estados de ejecución/entrega.        | Se muestran solo las órdenes coincidentes.                                                     |
| Permisos             | Con perfil sin escritura, cuando exista, intentar iniciar, consumir, finalizar o entregar. | Puede consultar con lectura, pero no cambia datos sin `workshop:write`.                        |

## Evidencia mínima

- Una orden en ejecución, una lista para entrega y una entregada.
- Actividades completadas y avance visible.
- Salida de inventario por consumo y su devolución compensatoria, ambas trazables a la orden.
- Stock antes/después de consumo y devolución.
- Historial visible en la ficha del vehículo.
- Resultados de migraciones, pruebas automatizadas, typecheck, lint, build, formato y `git diff --check`.
