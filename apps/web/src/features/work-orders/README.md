# Work orders (web)

Módulo de órdenes de taller: resumen, búsqueda, filtros por estado/técnico, listado y tarjetas responsive, paginación y ficha de detalle con diagnóstico, presupuesto, decisión del cliente, asignación de técnico, ejecución, consumo de repuestos, finalización y entrega.

- Ruta `/ordenes-taller` bajo el grupo **Operación de taller** de la navegación, protegida por `workshop:read`.
- Desde **Citas**, la acción **Atender y crear orden** aparece solo para citas `PROGRAMADA` cuando existe `workshop:write`; al atender se crea la orden `OT-######`, la cita pasa a `ATENDIDA` y se refrescan ambas listas.
- El diagnóstico se edita en `RECEPCIONADA`/`EN_DIAGNOSTICO`/`PENDIENTE_APROBACION`; la decisión exige presupuesto enviado (`PENDIENTE_APROBACION`); el técnico se asigna o cambia hasta que la orden esté `APROBADA`.
- El modal de presupuesto ofrece **Guardar borrador** y **Guardar y enviar**; subtotales, total y el precio congelado del catálogo se muestran en pantalla. Permite acumular cantidades del mismo producto, pero evita añadir un mismo servicio dos veces; la API conserva la validación definitiva.
- El listado suma chips de estados de ejecución y entrega (`EN_EJECUCION`, `LISTA_PARA_ENTREGA`, `ENTREGADA`) con sus colores y filtros.
- La ficha muestra el panel de ejecución (inicio, cronología de actividades, repuestos consumidos/devueltos) y, según estado y `workshop:write`, las acciones **Iniciar ejecución**, **Registrar/Completar actividad**, **Consumir repuesto**, **Devolver repuesto**, **Finalizar trabajo** y **Entregar vehículo**, con confirmación para transiciones irreversibles.
- El consumo permite marcar varios repuestos pendientes del presupuesto, ajustar cada cantidad y enviarlos en una sola operación; actividad, consumo, devolución y entrega validan cantidades restantes, stock disponible y observaciones. El consumo y la devolución envían un `requestId` para asegurar idempotencia.
- Al finalizar, la ficha expone un resumen económico que compara el presupuesto inicial con lo que se facturará. Los repuestos se facturan por su consumo neto (`consumido − devuelto`); los pendientes no utilizados no se cobran ni mueven existencias.
- El historial de mantenimiento del vehículo (órdenes entregadas) se consulta desde la ficha del vehículo, protegido por `workshop:read` y paginado.
- La consulta está limitada por `workshop:read`; las acciones por `workshop:write`.

## Experiencia (Sprint 15)

- El listado ofrece una acción accesible por fila (`Ver orden <código>`) alcanzable
  con teclado y su botón equivalente en la tarjeta móvil.

Sprint propietario: 09 (base) y 10 (ejecución y entrega).
