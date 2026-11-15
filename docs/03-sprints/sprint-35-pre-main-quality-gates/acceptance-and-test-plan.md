# Matriz de aceptación y prueba manual

## Precondiciones

- Base de desarrollo con las 48 migraciones aplicadas.
- Dos organizaciones de prueba activas: **Taller A** y **Taller B**.
- Un usuario operativo por organización y un administrador de plataforma.

## 1. Cliente y vehículo atómicos

1. Inicia sesión en Taller A y abre **Clientes**.
2. Registra un cliente y marca la opción para registrar su primer vehículo.
3. Completa placa, marca, modelo y kilometraje; guarda.
4. Abre el detalle del vehículo y consulta el historial.

**Esperado:** cliente y vehículo se crean una sola vez, aparecen asociados y el historial no muestra datos de Taller B.

## 2. Recepción y orden de taller

1. En Taller A abre **Taller** y crea una cita para hoy.
2. En la pestaña de citas, atiéndela e inicia la orden.
3. Completa el checklist: combustible, kilometraje, accesorios, daños y una URL de foto opcional.
4. Abre el detalle de la orden creada.

**Esperado:** la cita pasa a orden, el checklist se visualiza completo y no aparece un acceso directo redundante a Citas en el sidebar.

## 3. Cotización y conversión

1. En Taller A abre **Cotizaciones** y crea una con un producto y un servicio.
2. Guarda, usa la acción de WhatsApp y valida que se abra un mensaje prellenado sin registrar movimientos de inventario.
3. Convierte la cotización a una orden de taller.

**Esperado:** el código es único por organización, el total se conserva y la orden resultante queda vinculada a la cotización.

## 4. Venta y cobro inmediato

1. En Taller A registra una venta de mostrador.
2. Selecciona efectivo, ingresa un monto mayor al total y confirma el cobro.
3. Revisa el vuelto y el movimiento de caja.

**Esperado:** la venta queda confirmada, el pago queda registrado y el vuelto coincide exactamente con la diferencia.

### Aislamiento de caja entre talleres

1. En **Taller Desarrollo**, abre una caja y déjala abierta.
2. En una sesión distinta de **Taller A**, abre Caja y registra una apertura.
3. Confirma que ambas sesiones abiertas se visualizan únicamente dentro de su
   respectivo taller.
4. En Taller A intenta abrir una segunda caja.

**Esperado:** Taller A puede abrir su propia caja aunque Taller Desarrollo tenga
una abierta. Sólo la segunda apertura dentro de Taller A responde con un
conflicto controlado, nunca con error 500.

## 5. Mantenimiento preventivo

1. Desde Taller A abre **Mantenimiento preventivo**.
2. Verifica los filtros de prioridad y el enlace de WhatsApp de un recordatorio.
3. Confirma que un vehículo de Taller B no se muestra.

**Esperado:** prioridad crítica desde 5,000 km o seis meses, filtros correctos y aislamiento por organización.

## 6. Soporte de plataforma

1. Inicia sesión como administrador de plataforma.
2. Abre la organización Taller A e ingresa a modo soporte.
3. Navega a una sección operativa y valida el banner de impersonación.
4. Usa **Volver a la consola**.

**Esperado:** el soporte solo puede asumir una organización activa, el banner es visible y al salir se restaura la cuenta de plataforma.

## Criterio de aprobación

Todos los escenarios deben terminar sin errores de consola, con respuesta visual correcta en desktop y móvil, y sin datos cruzados entre Taller A y Taller B.
