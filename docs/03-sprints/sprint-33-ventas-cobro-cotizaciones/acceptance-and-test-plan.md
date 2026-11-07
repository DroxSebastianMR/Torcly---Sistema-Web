# Plan de Pruebas y Criterios de Aceptación - Sprint 33

## Matriz de Pruebas Manuales Paso a Paso

### Caso 1: Venta con Cobro Inmediato en Efectivo (Con Vuelto)
1. Abrir una sesión de Caja en el módulo de **Caja** (si no hay una abierta).
2. Ir a **Ventas** y hacer clic en **"Nueva venta"**.
3. Agregar 1 producto con precio total S/ 80.00.
4. Presionar **"Confirmar venta"**.
5. **Resultado esperado:** En lugar de enviar la venta a pendientes, se abre el modal de pago.
6. Seleccionar **Efectivo** e ingresar "Paga con: S/ 100.00".
7. Verificar que el sistema calcula *"Vuelto: S/ 20.00"*.
8. Presionar *"Cobrar y Finalizar"*.
9. **Resultado esperado:**
   * La venta queda en estado `CONFIRMED` y `PAGADA`.
   * En el módulo de Caja, aparece automáticamente el movimiento de ingreso de S/ 80.00 en la sesión activa.
   * No requiere ninguna acción adicional en Caja.

### Caso 2: Venta al Crédito o Cobro Diferido
1. En el modal de pago de una venta de S/ 150.00, hacer clic en *"Dejar como cobro pendiente (Crédito)"*.
2. **Resultado esperado:** La venta se confirma, pero queda con saldo pendiente por cobrar en el módulo de Caja, tal como funcionaba para compras diferidas.

### Caso 3: Creación de Presupuesto / Cotización y Compartir por WhatsApp
1. Ir al módulo de **Cotizaciones**.
2. Hacer clic en **"Nueva cotización"**.
3. Seleccionar un cliente con su número de teléfono y vehículo.
4. Agregar 2 repuestos y 1 servicio de mano de obra (Total: S/ 450.00).
5. Guardar el presupuesto en estado `ENVIADA`.
6. Hacer clic en el icono de **WhatsApp** en la tabla.
7. **Resultado esperado:** Abre WhatsApp con el mensaje prearmado:
   *"Estimado(a) Juan, le enviamos su cotización de Torcly para el vehículo ABC-123 por un total de S/ 450.00. Validez: 7 días..."*.

### Caso 4: Conversión de Cotización a Orden de Taller
1. En la tabla de cotizaciones, seleccionar una cotización enviada.
2. Hacer clic en **"Aprobar y convertir a Orden"**.
3. Confirmar la acción.
4. **Resultado esperado:**
   * El estado de la cotización cambia a `APROBADA`.
   * Se crea una nueva Orden de Taller con los repuestos y mano de obra del presupuesto.
   * La navegación redirige a la nueva orden creada en Taller.
