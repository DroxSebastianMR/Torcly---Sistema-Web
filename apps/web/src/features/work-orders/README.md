# Work orders (web)

Módulo de órdenes de taller: resumen, búsqueda, filtros por estado/técnico, listado y tarjetas responsive, paginación y ficha de detalle con diagnóstico, presupuesto, decisión del cliente y asignación de técnico.

- Ruta `/ordenes-taller` bajo el grupo **Operación de taller** de la navegación, protegida por `workshop:read`.
- Desde **Citas**, la acción **Atender y crear orden** aparece solo para citas `PROGRAMADA` cuando existe `workshop:write`; al atender se crea la orden `OT-######`, la cita pasa a `ATENDIDA` y se refrescan ambas listas.
- El diagnóstico se edita en `RECEPCIONADA`/`EN_DIAGNOSTICO`/`PENDIENTE_APROBACION`; la decisión exige presupuesto enviado (`PENDIENTE_APROBACION`); el técnico se asigna o cambia hasta que la orden esté `APROBADA`.
- El modal de presupuesto ofrece **Guardar borrador** y **Guardar y enviar**; subtotales, total y el precio congelado del catálogo se muestran en pantalla, pero la API conserva la validación definitiva.
- La consulta está limitada por `workshop:read`; las acciones por `workshop:write`.

Sprint propietario: 09.
