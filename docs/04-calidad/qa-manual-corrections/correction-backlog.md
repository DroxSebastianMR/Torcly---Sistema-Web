# Backlog de correcciones QA

## Evidencia revisada

El documento de prueba contiene siete capturas y ocho observaciones. La tabla no
repite documentos, contraseñas, UUIDs ni datos sensibles de las capturas; usa
solo los escenarios necesarios para reproducir cada caso.

| ID    | Hallazgo de la prueba                                                                                   | Clasificación                        | Sprint de origen |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------- |
| QA-01 | Tras cinco credenciales erróneas no aparece el bloqueo ni el tiempo restante.                           | Expectativa de seguridad             | 01, 16           |
| QA-02 | Al intentar entrar con un usuario desactivado se conserva un mensaje genérico.                          | Expectativa de seguridad             | 02, 16           |
| QA-03 | Después de completar un RUC válido, persiste visualmente el error rojo de documento.                    | Defecto de formulario                | 03               |
| QA-04 | La ruta inexistente muestra una pantalla amigable, pero no identifica de forma explícita el código 404. | Ajuste de feedback                   | 15               |
| QA-05 | La prueba reporta que se aceptan más de ocho citas activas en el mismo horario.                         | Reproducción e integración requerida | 08               |
| QA-06 | En ejecución de orden no se entiende por qué no hay repuestos para consumir/devolver.                   | Brecha de guía y experiencia         | 10               |
| QA-07 | El importe del cobro no conserva correctamente un valor decimal escrito, por ejemplo `100.00`.          | Defecto de formulario                | 11               |
| QA-08 | Se solicitan correcciones de decimales para cantidades en unidades.                                     | Validación transversal               | 05, 06           |

## QA-17 - Flujos críticos

### QA-05 - Límite de capacidad de citas

**Resultado de la revisión:** la API actual define una capacidad de 8, cuenta
solo citas `PROGRAMADA`, bloquea transaccionalmente por fecha/hora y devuelve
`APPOINTMENT_SLOT_FULL` a partir de la novena. Hay pruebas de reglas e
integración para ese contrato. La observación manual debe reproducirse sobre la
rama y base realmente probadas antes de cambiar la regla.

**Trabajo requerido:**

1. Crear o identificar nueve vehículos distintos y usar exactamente el mismo
   valor ISO de fecha y el mismo valor `HH:mm` para las nueve solicitudes.
2. Probar por UI y, cuando exista PostgreSQL descartable, mediante integración
   secuencial y concurrente.
3. Comprobar que las primeras ocho persisten y la novena responde 409 con
   `APPOINTMENT_SLOT_FULL`; una cancelación debe liberar un único cupo.
4. Si el defecto se reproduce, corregir la normalización o el envío de fecha/hora
   conservando el lock, la validación de vehículo ocupado y el contrato API.
5. Mejorar el feedback web únicamente si no expone información de otras citas.

**Aceptación:** nunca existen más de ocho citas activas para el mismo slot;
ni citas de otro día/hora ni canceladas cuentan para dicho límite.

### QA-06 - Consumo y devolución de repuestos en una orden

**Resultado de la revisión:** el selector solo ofrece líneas de producto del
presupuesto aprobado que aún tienen cantidad pendiente por consumir. Por ello,
una orden con solo servicios o con todos los productos ya consumidos muestra el
estado vacío observado. La devolución solo puede ocurrir después de un consumo
real, pues revierte parte de una salida de inventario existente.

**Trabajo requerido:**

1. Hacer visible en el diálogo el motivo del estado vacío y el requisito:
   "agrega y aprueba un producto en el presupuesto antes de iniciar el consumo".
2. Preparar un caso reproducible con un producto de inventario, saldo suficiente,
   presupuesto aprobado, consumo parcial y devolución parcial.
3. Verificar que consumo registra `EXIT`, devolución registra `ADJUSTMENT_IN`,
   y que ninguna operación duplica movimientos al reintentar.
4. Añadir pruebas de UI para el mensaje de precondición y pruebas de API para el
   flujo de salida/devolución existente o corregido.

**Aceptación:** el usuario comprende qué falta cuando no hay opciones; con una
línea de producto aprobada puede consumir y después devolver sin stock negativo.

### QA-07 - Importe de pago decimal

**Resultado de la revisión:** el input controlado convierte cada pulsación a
`Number` y luego la vuelve a renderizar. Eso elimina valores intermedios válidos
como `100.` y puede impedir escribir `100.00` de forma natural.

**Trabajo requerido:**

1. Conservar el texto del importe mientras se edita; convertir y validar al
   confirmar o al abandonar el campo.
2. Aceptar importes positivos con hasta dos decimales, incluidos `100.00` y
   parciales válidos, sin superar el saldo calculado por servidor.
3. Conservar el valor ante una validación o rechazo de API y mantener el
   `requestId` por intento de envío.
4. Añadir pruebas de escritura de importe, decimal intermedio, pago parcial,
   rechazo por exceso y persistencia visual del valor.

**Aceptación:** se puede registrar un pago parcial exacto; el API sigue siendo la
fuente de verdad para saldo, idempotencia y estado de cobro.

## QA-18 - Formularios y feedback

### QA-03 - Error persistente de RUC

**Resultado de la revisión:** el formulario valida por defecto al enviar. Tras
un envío inválido, cambiar el documento a un RUC de 11 dígitos no revalida de
inmediato, por lo que el mensaje anterior puede seguir visible.

**Trabajo requerido:**

1. Revalidar el documento al cambiarlo después del primer error, sin perder el
   resto de valores ni relajar las validaciones de API.
2. Cubrir persona jurídica con RUC válido, razón social y teléfono válidos.
3. Verificar que el mensaje desaparece al corregir y vuelve si el RUC queda
   inválido.

**Aceptación:** un RUC válido de 11 dígitos no conserva la advertencia roja de
documento; un RUC inválido sí muestra una razón comprensible.

### QA-04 - Identificación de error 404

**Resultado de la revisión:** existe una página de ruta inexistente clara y con
salida al inicio, pero no contiene el texto/código `404` solicitado por QA.

**Trabajo requerido:**

1. Añadir una identificación visible y accesible como `Error 404` sin sustituir
   el título amigable ni el botón de retorno.
2. Mantener separada la pantalla de error inesperado.
3. Actualizar los tests del router y del componente de feedback.

**Aceptación:** una ruta inexistente comunica a la vez que no existe, que es un
error 404 y ofrece un camino seguro al inicio.

## QA-19 - Seguridad y precisión de datos

### QA-01 - Bloqueo por credenciales erróneas

**Decisión de seguridad:** no se debe confirmar desde el login si la cuenta
probada existe, está bloqueada o cuánto tiempo le falta. Esa información ayuda a
enumerar cuentas y a afinar ataques de contraseña.

**Trabajo requerido:**

1. Mantener una respuesta de login uniforme y no enumerativa.
2. Verificar que a los cinco fallos se persisten bloqueo temporal y evento de
   auditoría, y que el acceso vuelve a evaluarse al expirar el periodo.
3. Ajustar la guía de prueba: el resultado visible debe ser genérico; el bloqueo
   se confirma desde administración/auditoría autorizada o una prueba de API
   controlada.

**Aceptación:** el bloqueo funciona sin revelar identidad, estado ni tiempo
restante a una persona no autenticada.

### QA-02 - Usuario desactivado

**Decisión de seguridad:** por el mismo motivo, el login no diferencia una
cuenta inexistente de una desactivada. La administración autorizada sí debe
mostrar el estado real.

**Trabajo requerido:**

1. Mantener el rechazo uniforme en login.
2. Verificar desde Usuarios que la cuenta permanece, aparece inactiva y no
   obtiene sesión después de desactivarse.
3. Actualizar el caso manual para comprobar ambas evidencias sin exigir un
   mensaje que revele el estado en login.

**Aceptación:** la cuenta inactiva no accede; su condición es trazable solo en
la superficie administrativa protegida.

### QA-08 - Política de decimales en unidades

**Resultado de la revisión:** el modelo de producto, inventario, ventas y
taller usa `Decimal(12,3)` y el formulario permite tres decimales. No es un
error aislado del campo mostrado: cambiarlo globalmente sin política rompería
flujos que vendan litros, kilos u otras unidades fraccionables.

**Política aprobada:** toda cantidad, incluida `und`, admite desde cero hasta
tres decimales. Un cuarto decimal debe rechazarse antes de persistir.

**Trabajo requerido:**

1. Aplicar una validación transversal de máximo tres decimales, no una excepción
   visual aislada.
2. Aplicarla de manera coherente en producto, stock inicial, entrada, salida,
   ajuste, venta, presupuesto, consumo y devolución.
3. Validar en web y API, respetar datos existentes y conservar el tipo
   `Decimal(12,3)` ya existente; no crear migración para esta corrección.
4. Añadir pruebas para entero, uno/tres decimales y rechazo de cuatro decimales.

**Aceptación:** todos los flujos aceptan hasta tres decimales y rechazan un
cuarto decimal sin redondearlo silenciosamente.
