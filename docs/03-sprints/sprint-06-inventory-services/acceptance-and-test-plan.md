# Aceptación y pruebas - Sprint 06

- El stock coincide con la suma confirmada de entradas menos salidas (nunca se edita directamente).
- Cantidades cero/negativas y salidas superiores al stock se rechazan.
- Reintentar la misma operación no descuenta ni suma dos veces (replay por `idempotencyKey`).
- Dos salidas simultáneas nunca producen stock negativo (concurrencia con advisory lock).
- Cada movimiento conserva producto, tipo, cantidad, fecha, usuario y origen.
- Una alerta aparece cuando stock ≤ mínimo, con texto además de color.
- Servicio duplicado o precio negativo se rechaza.
- Desactivar servicio lo excluye de nuevas selecciones y conserva su registro.
- Sin permiso no se muestran acciones de registro/edición ni la ruta.
- Test, typecheck, lint y build pasan.

## Prueba manual (recomendada antes de aprobar)

Con la API y la web en local y habiendo aplicado las migraciones (`npx prisma migrate dev`) y el seed:

1. **Stock inicial**: en Inventario pestaña «Existencias», abrir «Stock inicial», elegir un producto activo, cantidad 10 y registrar. Confirmar que aparece la fila con 10 y el badge «En orden».
2. **Entrada**: registrar una entrada de 5. El resumen sube a 15.
3. **Salida y alerta**: registrar una salida de 14. Queda 1; al tener `stock ≤ stock mínimo`, verificar el texto «Stock bajo»/«Por debajo del mínimo» (no solo el color).
4. **Insuficiencia**: intentar una salida mayor al stock disponible; la API responde `INSUFFICIENT_STOCK` y la web muestra el mensaje sin cambiar el stock.
5. **Idempotencia**: reenviar el mismo intento (mismo `idempotencyKey`) y verificar que no duplica el movimiento.
6. **Historial**: en «Historial», filtrar por producto, tipo y rango de fechas; validar cantidad con signo, fecha/hora, usuario que registró y origen/referencia.
7. **Servicios**: en `/servicios` crear un servicio (código en mayúsculas, precio válido), editarlo, desactivarlo y volver a activarlo; confirmar en el selector de nuevo servicio que solo aparecen los activos.
8. **Permisos**: con un usuario sin `inventory:write`/`services:write`, verificar que no ve acciones de registro ni edición.
