# Regla de consumo, devolución y facturación final

## Propósito

Esta regla define cómo una orden de taller aprobada se convierte en una venta al
entregar el vehículo. Evita cobrar repuestos que no se utilizaron y mantiene el
inventario trazable.

## Conceptos

| Concepto     | Significado                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Presupuesto  | Propuesta inicial aprobada por el cliente. Reserva el máximo que puede consumirse, pero no es por sí mismo un cargo. |
| Consumo      | Repuesto realmente usado en el trabajo. Genera una salida `EXIT` de inventario.                                      |
| Devolución   | Repuesto que ya había sido consumido/salido y luego se devuelve porque no se utilizó. Genera un `ADJUSTMENT_IN`.     |
| Pendiente    | Cantidad presupuestada que nunca se consumió. No mueve inventario y no se cobra.                                     |
| Consumo neto | Cantidad finalmente utilizada: `consumido - devuelto`.                                                               |

## Regla definitiva

1. El presupuesto es el límite y la referencia de precios, no el total que se
   cobra automáticamente.
2. Los servicios aprobados sí se incluyen con su cantidad y precio del
   presupuesto, porque no dependen de inventario.
3. Un producto se factura solo por su **consumo neto**. La fórmula por línea es:

   ```text
   cantidad facturable = cantidad consumida - cantidad devuelta
   importe facturable = cantidad facturable × precio congelado de la línea
   ```

4. Las cantidades pendientes del presupuesto que jamás se consumieron se
   consideran no utilizadas: no generan salida de stock ni venta.
5. Una devolución siempre corresponde a un consumo previo. Repone el stock y
   reduce tanto el consumo neto como el importe final del producto.
6. Al entregar, el servidor crea una única venta `CONFIRMED` vinculada a la
   orden. Esa venta incluye los servicios aprobados y solo las líneas de
   producto cuyo consumo neto sea mayor que cero.
7. La venta resultante aparece como obligación pendiente en **Caja**. Entregar
   la orden no registra un pago automático.

## Ejemplos

Presupuesto: 3 aceites a S/ 500 cada uno y un servicio de S/ 90.

| Caso                               | Consumo | Devolución | Aceites facturados |   Productos | Servicio |  Total de venta |
| ---------------------------------- | ------: | ---------: | -----------------: | ----------: | -------: | --------------: |
| Se usan dos                        |       2 |          0 |                  2 | S/ 1,000.00 | S/ 90.00 | **S/ 1,090.00** |
| Se usan dos y se devuelve uno      |       2 |          1 |                  1 |   S/ 500.00 | S/ 90.00 |   **S/ 590.00** |
| Se usan los tres y se devuelve uno |       3 |          1 |                  2 | S/ 1,000.00 | S/ 90.00 | **S/ 1,090.00** |
| No se usa ningún aceite            |       0 |          0 |                  0 |     S/ 0.00 | S/ 90.00 |    **S/ 90.00** |

En particular, devolver una unidad después de consumir dos significa que solo
una unidad quedó utilizada y facturable. La devolución no se descuenta del
presupuesto original; compensa una salida que ya ocurrió.

## Comprobaciones operativas

- Antes de finalizar, el panel de la orden muestra lo presupuestado, consumido,
  devuelto, consumo neto y pendiente por cada repuesto.
- Antes y después de entregar, el resumen económico compara el presupuesto
  inicial con el total que se facturará o facturó.
- En Inventario debe existir una salida por cada consumo y una entrada de ajuste
  por cada devolución; nunca se modifica ni borra el movimiento original.
- La venta vinculada debe reflejar la cantidad neta de cada producto y la
  cantidad presupuestada de cada servicio.

## Responsabilidad de la validación

La interfaz informa el cálculo, pero el servidor lo vuelve a calcular dentro de
la transacción de entrega. Por ello, modificar valores visibles en el navegador
no puede aumentar ni reducir el importe final fuera de las reglas anteriores.
