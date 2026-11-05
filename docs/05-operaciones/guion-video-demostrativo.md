# Guion de video demostrativo de Torcly

**Versión:** 1.0.1  
**Duración sugerida:** 18 a 25 minutos  
**Objetivo:** demostrar un flujo completo y trazable: catálogo, inventario,  
atención, taller, ventas, caja, dashboard y reportes.

> Usa un solo producto durante la demostración. Así será fácil comprobar cómo  
> sus movimientos recorren Inventario, Orden de taller, Venta y Caja.

## Datos sugeridos

| Elemento            | Valor para la demostración                                            |
| ------------------- | --------------------------------------------------------------------- |
| Categoría           | Filtración demostrativa                                               |
| Marca               | Bosch demostración                                                    |
| Unidad              | Unidad demostración (`und`)                                           |
| Producto            | Filtro de aceite Bosch P 3312                                         |
| Precio              | S/ 45.00                                                              |
| Stock mínimo        | 5 und                                                                 |
| Stock inicial       | 20 und                                                                |
| Entrada             | 10 und                                                                |
| Salida manual       | 1 und                                                                 |
| Servicio            | Cambio de aceite y filtro                                             |
| Precio del servicio | S/ 80.00                                                              |
| Técnico             | Carlos Mendoza Ramos                                                  |
| Cliente             | María Fernanda López, DNI 74839261, teléfono 987654321                |
| Vehículo            | Toyota Yaris 2021, placa MDE-321                                      |
| Diagnóstico         | Se recomienda cambio de aceite y filtro por mantenimiento preventivo. |

## 1\. Inicio e introducción

**Mostrar:** inicio de sesión y Dashboard.

**Narración sugerida:**

> Bienvenidos a Torcly, sistema de gestión para talleres mecánicos. En este  
> recorrido mostraremos cómo se conectan catálogo, inventario, atención,  
> órdenes de taller, ventas, caja y reportes.

> El objetivo es demostrar que cada movimiento queda trazado desde que un  
> producto ingresa al almacén hasta que se cobra o se anula una venta.

## 2\. Preparar catálogos y crear un producto

**Ir a:** Productos → **Catálogos de productos**.

1.  En la pestaña **Categorías**, crear `Filtración demostrativa`.
2.  En **Marcas**, crear `Bosch demostración`.
3.  En **Unidades**, crear `Unidad demostración` con abreviatura `und`.
4.  Cerrar Catálogos y pulsar **Registrar producto**.
5.  Completar nombre, categoría, marca, unidad, precio `45.00` y stock mínimo  
    `5`.
6.  Revisar el código automático mostrado por el sistema.
7.  Guardar el producto.

**Narración sugerida:**

> Antes de registrar productos, configuramos los catálogos que normalizan sus  
> datos: categorías, marcas y unidades de medida.

> El código del producto se genera automáticamente a partir de la información  
> registrada. Es un identificador controlado por el sistema: se muestra para  
> consulta y trazabilidad, pero no se edita manualmente. Esto evita códigos  
> inconsistentes o duplicados.

> El producto se crea sin existencias; sus cantidades se administran  
> exclusivamente desde Inventario.

## 3\. Inventario: stock inicial, entrada, salida e historial

**Ir a:** Inventario.

### Stock inicial

1.  Pulsar **Stock inicial**.
2.  Seleccionar el filtro creado.
3.  Registrar `20` unidades y guardar.

### Entrada

1.  Pulsar **Entrada**.
2.  Seleccionar el mismo producto y registrar `10` unidades.
3.  En notas escribir: `Ingreso de mercadería para demostración`.
4.  Guardar.

### Salida manual

1.  Pulsar **Salida**.
2.  Seleccionar el producto y registrar `1` unidad.
3.  En notas escribir: `Uso interno de demostración`.
4.  Guardar.

### Historial

1.  Cambiar a la pestaña **Historial**.
2.  Mostrar los movimientos de stock inicial, entrada y salida.
3.  Destacar tipo, cantidad, fecha y usuario que registró la operación.

**Narración sugerida:**

> El servidor calcula el saldo a partir de movimientos inmutables. En el  
> historial podemos comprobar quién hizo cada operación, cuándo se realizó y  
> cómo afectó las existencias.

## 4\. Crear un servicio

**Ir a:** Servicios → **Registrar servicio**.

1.  Registrar `Cambio de aceite y filtro` con precio `80.00`.
2.  Revisar el código de servicio generado automáticamente.
3.  Guardar.

**Narración sugerida:**

> El código del servicio, igual que el del producto, lo asigna Torcly de forma  
> automática y no es editable. Esto mantiene una nomenclatura consistente para  
> presupuestos, ventas y reportes.

> Los servicios no generan movimientos de inventario, pero sí pueden formar  
> parte de presupuestos y ventas.

## 5\. Crear un técnico

**Ir a:** Técnicos → **Registrar técnico**.

1.  Nombre: `Carlos Mendoza Ramos`.
2.  Documento: `70458963`.
3.  Teléfono: `986321457`.
4.  Especialidades: `Mantenimiento preventivo y lubricación`.
5.  Guardar.

**Narración sugerida:**

> Los técnicos son un catálogo operativo. No requieren usuario, contraseña ni  
> acceso a Torcly: se registran para asignarlos a órdenes y mantener la  
> trazabilidad del trabajo realizado.

## 6\. Crear cliente y vehículo

### Cliente

**Ir a:** Clientes → **Nuevo cliente**.

1.  Registrar a María Fernanda López con DNI `74839261` y teléfono `987654321`.
2.  Guardar.

### Vehículo

**Ir a:** Vehículos → **Registrar vehículo**.

1.  Placa: `MDE-321`.
2.  Marca: Toyota; modelo: Yaris; año: 2021.
3.  Elegir a María Fernanda López como propietaria.
4.  Guardar.

**Narración sugerida:**

> El vehículo se vincula a su propietario desde el registro. Esta relación  
> permite ver luego el historial técnico y las atenciones de cada unidad.

## 7\. Crear y reprogramar una cita

**Ir a:** Citas → **Nueva cita**.

1.  Seleccionar cliente y vehículo.
2.  Elegir el día actual y hora `2:00 p. m.`.
3.  Motivo: `Mantenimiento preventivo: cambio de aceite y filtro`.
4.  Registrar la cita.
5.  Abrir su detalle y elegir **Reprogramar**.
6.  Cambiar la hora a `3:00 p. m.` o moverla al día siguiente.
7.  Confirmar la reprogramación.

**Narración sugerida:**

> La cita conserva la trazabilidad de su cambio de fecha u hora y sigue  
> asociada al mismo cliente, vehículo y motivo.

## 8\. Atender cita y crear orden

1.  Abrir la cita programada.
2.  Pulsar **Atender y crear orden** y confirmar.
3.  Mostrar que la cita pasa a atendida.
4.  Ir a **Órdenes de taller** y abrir la orden creada.

**Narración sugerida:**

> Al atender una cita se crea automáticamente una sola orden de taller. La  
> misma cita no puede producir una segunda orden, evitando duplicidades.

## 9\. Diagnóstico, técnico y presupuesto

### Diagnóstico

1.  Elegir **Registrar diagnóstico**.
2.  Registrar el diagnóstico sugerido y guardar.

### Técnico

1.  Elegir **Asignar técnico**.
2.  Seleccionar Carlos Mendoza Ramos.
3.  Guardar; el sistema vuelve al detalle de la orden.

### Presupuesto

1.  Elegir **Crear presupuesto**.
2.  Agregar el filtro con cantidad presupuestada `2`.
3.  Agregar el servicio Cambio de aceite y filtro.
4.  Revisar el total: productos S/ 90.00 + servicio S/ 80.00 = S/ 170.00.
5.  Elegir **Guardar y enviar**.
6.  Registrar la decisión: `Cliente aprobó el presupuesto`.
7.  Pulsar **Iniciar ejecución**.

**Narración sugerida:**

> El presupuesto congela precio, descripción y cantidad. Si en el catálogo  
> cambian los precios después, esta orden conserva el precio acordado.

> Productos repetidos se consolidan y un servicio no se duplica dentro del  
> mismo presupuesto.

## 10\. Consumir, devolver y registrar actividades

### Consumo

1.  Elegir **Consumir repuestos**.
2.  Marcar el filtro y registrar consumo de `2` unidades.
3.  Guardar y abrir Inventario si se desea comprobar la salida.

### Devolución

1.  Volver a la orden y elegir **Devolver repuestos**.
2.  Seleccionar el filtro y devolver `1` unidad.
3.  Registrar la devolución.

### Actividad

1.  Elegir **Registrar actividad**.
2.  Registrar: `Se realizó cambio de aceite y filtro; se verificó el nivel de lubricante.`
3.  Usar la fecha actual y guardar.

**Narración sugerida:**

> El consumo crea una salida trazable de inventario. Si una unidad que ya salió  
> no se utiliza, la devolución crea una entrada de ajuste sin borrar la salida  
> original.

> La regla de cobro es consumo neto: consumido menos devuelto. Si se consumen  
> dos filtros y se devuelve uno, se factura solo un filtro.

## 11\. Finalizar y entregar el vehículo

1.  Elegir **Finalizar orden**.
2.  Si quedan productos pendientes, confirmar que no fueron utilizados.
3.  Mostrar el resumen: presupuesto inicial, consumido, devuelto, consumo neto  
    y total facturable.
4.  Elegir **Registrar entrega**.
5.  Nota: `Vehículo entregado con mantenimiento preventivo realizado.`
6.  Confirmar.

**Narración sugerida:**

> Los productos pendientes que nunca se consumieron no descuentan stock ni se  
> cobran. Los servicios aprobados sí se incluyen. Al entregar, Torcly genera  
> una venta confirmada y pendiente de cobro; entregar no equivale a cobrar.

## 12\. Ventas: orden de taller y venta directa

**Ir a:** Ventas.

1.  Abrir la venta creada por la orden y comprobar cantidades y total final.
2.  Crear una **Nueva venta** individual, con o sin cliente.
3.  Agregar un producto con stock, cantidad `1`.
4.  Guardar y confirmar.

**Narración sugerida:**

> Torcly admite ventas generadas automáticamente por órdenes entregadas y  
> ventas directas de mostrador. Ambas conservan su relación con inventario y  
> pueden cobrarse en Caja.

## 13\. Caja: apertura, pagos y compensaciones

**Ir a:** Caja.

### Apertura

1.  Elegir **Abrir caja**.
2.  Monto inicial: `100.00`.
3.  Nota: `Apertura de demostración`.
4.  Confirmar.

### Venta de orden: pago parcial y pago final

1.  Abrir la obligación de la orden.
2.  Cobrar S/ 50.00 en efectivo; mostrar estado parcial y saldo.
3.  Registrar el saldo restante por tarjeta.
4.  Mostrar que el estado cambia a pagado.

### Venta directa: pago mixto

1.  Abrir la obligación de la venta directa.
2.  Registrar una parte en efectivo y el resto por transferencia, tarjeta o  
    billetera digital.
3.  Confirmar estado pagado y los importes por método en la caja actual.

**Narración sugerida:**

> Caja separa los importes por medio de pago. Una venta queda pagada solo al  
> cubrir la totalidad de su saldo; los pagos parciales siguen mostrando el  
> monto pendiente.

## 14\. Anular la venta directa y comprobar reposición

> No usar la venta creada por la orden. Usar exclusivamente la venta directa.

1.  Abrir el detalle de la venta directa pagada.
2.  Explicar que antes de anular se deben compensar sus pagos en Caja.
3.  Compensar cada pago con motivo: `El cliente desistió de la compra antes de retirar el producto.`
4.  Volver a Ventas, abrir la venta y elegir **Anular venta**.
5.  Registrar el motivo y confirmar.
6.  Ir a Inventario → Historial y comprobar la reposición del producto.

**Narración sugerida:**

> Por control financiero, una venta pagada no se anula directamente: primero se  
> compensan los cobros. Luego la anulación repone existencias y conserva la  
> trazabilidad completa de pagos, compensaciones y movimiento de inventario.

## 15\. Dashboard y reportes

### Dashboard

Mostrar las tarjetas y listas de:

- Citas para hoy.
- Órdenes activas.
- Cobros pendientes.
- Stock bajo.
- Próximas citas, inventario por revisar y actividad reciente.

**Narración sugerida:**

> El Dashboard responde qué requiere atención hoy. Es una vista operativa y no  
> sustituye los análisis detallados de Reportes.

### Reportes

1.  Elegir el período de la demostración.
2.  Mostrar indicadores y gráficos de ventas.
3.  Usar la navegación para revisar cobros, inventario, servicios y taller.
4.  Mostrar rankings de productos o servicios principales.
5.  Pulsar **Exportar Excel**.

**Narración sugerida:**

> Reportes analiza información confirmada por período. Permite identificar  
> ventas, cobros, consumo de inventario, rendimiento de servicios y actividad  
> de taller; además, puede exportarse a Excel para análisis administrativo.

## Cierre

> Hemos recorrido el flujo operativo completo de Torcly. Cada proceso queda  
> conectado: inventario respalda consumos y anulaciones; la orden crea una  
> venta; la venta se cobra desde caja; y dashboard y reportes presentan el  
> resultado para la toma de decisiones.
