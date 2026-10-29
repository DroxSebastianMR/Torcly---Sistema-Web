# Guía manual integrada — Sprints 09 a 13

Esta guía prueba el flujo completo sin alterar datos fuera del caso de demostración. Usa una cita y una venta nuevas si deseas repetirla.

## Preparación

1. Inicia servicios con `pnpm dev` e ingresa con el administrador.
2. Confirma que exista un cliente con vehículo, un producto activo con stock y un servicio activo.
3. Anota el stock inicial del producto y usa importes pequeños. Captura cada resultado importante.

## Sprint 09 — Cita a presupuesto aprobado

1. En **Citas**, registra una cita futura para el vehículo y motivo de mantenimiento.
2. Abre la cita y pulsa **Atender y crear orden**. Debe quedar `ATENDIDA` y generar una única `OT-######`.
3. En **Órdenes de taller**, abre la orden, registra diagnóstico y asigna técnico.
4. Agrega una línea de producto y una de servicio; guarda y envía presupuesto.
5. Aprueba el presupuesto.

Resultado: la orden queda `APROBADA`, conserva diagnóstico, técnico, líneas y precios. El stock no cambia al presupuestar ni aprobar.

## Sprint 10 — Ejecución, inventario y entrega

1. Desde la orden aprobada, pulsa **Iniciar ejecución**.
2. Registra una actividad y complétala.
3. Consume una unidad del producto presupuestado. Verifica en **Inventario** una sola salida asociada y stock reducido.
4. Opcional: devuelve la unidad y verifica `AJUSTE (ingreso)` sin borrar la salida; vuelve a consumirla para continuar.
5. Finaliza el trabajo y registra la entrega con una observación.
6. Abre el vehículo y revisa su historial.

Resultado: la orden pasa por `EN_EJECUCIÓN`, `LISTA PARA ENTREGA` y `ENTREGADA`; actividades, consumo/devolución e historial son trazables. Una orden entregada ya no permite nuevas acciones de ejecución.

## Sprint 11 — Cobros y saldo

1. En **Ventas**, crea y confirma una venta con total positivo si no existe una confirmada pendiente. Anota total y stock.
2. En **Caja**, busca la venta y abre su detalle.
3. Registra un pago parcial con un método válido. Verifica estado `Parcialmente pagada`, total pagado y saldo.
4. Registra el importe exacto restante. Debe quedar `Pagada` con saldo `S/ 0.00`.
5. Compensa parcialmente uno de los pagos, con motivo. El pago original no se edita ni desaparece y el saldo se recalcula.
6. Revisa Inventario: pagar o compensar no crea movimientos ni cambia stock.

Resultado: no se admiten importes cero, negativos ni superiores al saldo; los eventos mantienen usuario, fecha, método y motivo.

## Sprint 12 — Consulta operativa

1. Abre **Dashboard** y verifica que se muestren solo tarjetas autorizadas.
2. Contrasta citas, órdenes, ventas, saldos pendientes e inventario bajo con sus módulos de origen.
3. Aplica un período y verifica que citas, órdenes y ventas cambien por fecha; caja e inventario son instantáneas actuales.
4. Pulsa **Ver módulo** en cada tarjeta y comprueba navegación correcta, sin UUIDs visibles.
5. Prueba un período sin registros: debe verse un estado vacío claro, no cifras inventadas.

Resultado: Dashboard es estrictamente de lectura y no permite crear, cobrar, entregar ni mover inventario.

## Sprint 13 — Reportes BI

1. Abre **Reportes** y conserva el período predefinido de últimos 30 días.
2. Revisa indicadores y desglose de **Ventas**; compara cantidades/importes con Ventas confirmadas.
3. Revisa **Cobros**; compara cobrado y saldo con Caja, incluyendo la compensación registrada.
4. Revisa **Inventario**, **Servicios** y **Taller**; compara sus tablas y series con los módulos de origen.
5. Cambia a un período sin datos y verifica estados vacíos. Luego usa un rango mayor a 31 días para comprobar la agrupación semanal/mensual cuando haya datos.
6. Navega con teclado: cada gráfico debe ofrecer valores y tabla equivalente; los bloques sin permiso no deben aparecer como cero.

Resultado: cada cifra es trazable, el período y criterio son visibles y Reportes no tiene mutaciones, exportaciones ni UUIDs internos.

## Evidencia y cierre

- Capturas de la cita/orden, consumo y entrega.
- Historial de pago parcial, total y compensación; stock antes/después.
- Dashboard y Reportes comparados con fuentes.
- Logs API de rendimiento: `database_transaction_completed` y `http_request_completed`, con `requestId` y `durationMs`.

Al completar el recorrido, marca las actas de aprobación de los Sprints 11, 12 y 13 solo si no hay divergencias entre los módulos fuente y las vistas de consulta.
