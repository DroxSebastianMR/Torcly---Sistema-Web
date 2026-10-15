# Guía integral de prueba manual — Sprints 01 a 13

Esta guía permite validar de forma ordenada todo lo implementado desde la
fundación de la plataforma hasta BI. Está diseñada para una base de datos de
**desarrollo o demostración**: crea datos propios, conserva su trazabilidad y
evita alterar datos reales.

> No uses esta guía contra producción. Las pruebas crean usuarios, clientes,
> vehículos, movimientos de inventario, ventas, citas, órdenes y pagos.

Si es tu primera vez ejecutando estas pruebas, sigue la
[guía rápida paso a paso](step-by-step-guide.md).

## 1. Alcance y resultado esperado

| Tramo                   | Sprints       | Resultado verificable                                                        |
| ----------------------- | ------------- | ---------------------------------------------------------------------------- |
| Acceso y seguridad      | 01, 02 y 02.1 | Sesiones, usuarios, permisos y mensajes de sistema consistentes.             |
| Datos maestros          | 03 a 06       | Clientes, vehículos, productos, catálogos, inventario y servicios trazables. |
| Operación comercial     | 07 y 08       | Ventas con inventario y agenda de citas con reglas de capacidad.             |
| Operación de taller     | 09 y 10       | Orden desde cita, presupuesto, ejecución, consumo, devolución y entrega.     |
| Caja y consulta         | 11 y 12       | Cobros parciales, saldos derivados y Dashboard de solo lectura.              |
| Inteligencia de negocio | 13            | Indicadores y desglose trazables a los módulos fuente.                       |

Los Sprints 01 a 10 figuran como aprobados en el índice de sprints. Los
Sprints 11, 12 y 13 requieren esta prueba conjunta y la aprobación expresa del
usuario antes de cambiar su estado documental.

## 2. Preparación única

### 2.1 Entorno y base de datos

1. Trabaja sobre la rama que contenga los Sprints 01 a 13 y confirma que no
   tienes cambios ajenos sin guardar.
2. Configura `apps/api/.env` con una base de datos de desarrollo válida. Las
   variables `DATABASE_URL` y `DIRECT_URL` son obligatorias.
3. Ejecuta, desde la raíz del repositorio:

   ```bash
   pnpm db:check
   pnpm db:migrate:deploy
   pnpm db:seed
   pnpm dev
   ```

4. Comprueba:
   - Web: `http://127.0.0.1:5173`.
   - API: `http://127.0.0.1:3000/api/v1/health`.
   - No hay errores de `EADDRINUSE`, `POOLER_HOST`, `DIRECT_URL` ni Prisma en
     el terminal.
5. Inicia sesión con el correo o usuario y la contraseña definidos por
   `SEED_ADMIN_*` en `apps/api/.env`.
6. Abre DevTools solo si necesitas evidencia técnica; no copies contraseñas,
   cookies ni cadenas de conexión a capturas o documentación.

### 2.2 Datos de prueba a anotar

Usa un sufijo único, por ejemplo `QA1015`, para que puedas encontrar y limpiar
tus datos. Reemplaza los valores entre `<...>` por valores válidos y no usados.

| Recurso            | Dato de prueba sugerido                      | Se reutiliza en            |
| ------------------ | -------------------------------------------- | -------------------------- |
| Usuario auxiliar   | `qa1015` / `qa1015@torcly.local`             | Sprints 02 y 01 (bloqueo). |
| Cliente natural    | DNI `<DNI_UNICO_8_DIGITOS>`                  | Sprints 03 a 10.           |
| Cliente jurídico   | RUC `<RUC_UNICO_11_DIGITOS>`                 | Sprint 03 y búsquedas.     |
| Vehículo principal | Placa única, por ejemplo `QAT123`            | Sprints 04, 08 a 10.       |
| Producto operativo | Código `QA-FILTRO-1015`, stock mínimo `3`    | Sprints 05 a 13.           |
| Servicio operativo | Código `QA-SERV-1015`                        | Sprints 06, 07, 09, 13.    |
| Venta de prueba    | Una venta confirmada con producto y servicio | Sprints 07, 11 a 13.       |
| Cita principal     | Vehículo principal, fecha/hora futura        | Sprints 08 a 10.           |

Antes de la venta, anota la existencia del producto. Usa cantidades pequeñas:
stock inicial `10`, entrada `5`, salida `1` y consumo de orden `1`.

### 2.3 Evidencia mínima

Durante el recorrido guarda capturas o anota:

- código de usuario, cliente, vehículo, producto, servicio, venta, cita y
  orden creados;
- stock del producto antes y después de cada operación que lo afecte;
- total, pagado y saldo de la venta;
- estado final de cita y orden;
- una captura de Dashboard y otra de Reportes comparadas con sus fuentes;
- cualquier fallo: hora, acción, mensaje visible y `requestId` de API si
  existe.

## 3. Recorrido de aceptación

Marca cada fila solo cuando el resultado observado coincida con el esperado.
Los casos negativos no deben modificar información si son rechazados.

---

## Sprint 01 — Fundación y autenticación

| ID     | Acción                                                                                     | Resultado esperado                                                               | Evidencia                                      |
| ------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| S01-01 | Ingresa con el administrador sembrado y credenciales correctas.                            | Accede al espacio de trabajo y recibe solo sus permisos efectivos.               | Pantalla inicial.                              |
| S01-02 | Recarga el navegador y navega a un módulo protegido.                                       | La sesión continúa válida; no pide iniciar sesión nuevamente.                    | Módulo abierto.                                |
| S01-03 | Cierra sesión y usa Atrás o escribe una ruta protegida.                                    | Redirige a login o informa que se requiere sesión; no muestra datos protegidos.  | Login/redirección.                             |
| S01-04 | Intenta iniciar sesión con usuario inexistente y contraseña cualquiera.                    | Rechazo genérico, sin revelar si el usuario existe.                              | Mensaje visible.                               |
| S01-05 | Después de crear el usuario auxiliar en S02, realiza cinco intentos fallidos con él.       | El sexto intento queda bloqueado de forma genérica durante 15 minutos.           | Registro de intentos; no usar la cuenta admin. |
| S01-06 | Ejecuta nuevamente `pnpm db:seed` después de S01-05 y entra con el administrador sembrado. | La semilla restaura el administrador configurado y el acceso vuelve a funcionar. | Salida `Seed completado...`.                   |

Notas de seguridad a comprobar visualmente: la contraseña nunca debe aparecer
en texto plano en mensajes o consola; el frontend no debe mostrar ni copiar un
token de sesión.

---

## Sprint 02 — Usuarios y control de acceso

| ID     | Acción                                                                                                       | Resultado esperado                                                         | Evidencia                |
| ------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------ |
| S02-01 | Abre **Usuarios** como administrador.                                                                        | Lista, búsqueda, resumen y acciones se muestran.                           | Listado.                 |
| S02-02 | Crea el usuario auxiliar con correo y usuario únicos, contraseña válida y un rol existente.                  | Se crea una única cuenta activa.                                           | Código/datos de usuario. |
| S02-03 | Busca por nombre, correo y usuario; abre su detalle.                                                         | La coincidencia es correcta y persiste al recargar.                        | Ficha.                   |
| S02-04 | Edita nombre visible o correo por un valor válido.                                                           | Se actualiza y conserva el historial de la cuenta.                         | Ficha actualizada.       |
| S02-05 | Intenta crear o editar con correo/usuario ya usado.                                                          | Rechazo claro; no se crea duplicado.                                       | Mensaje de validación.   |
| S02-06 | Desactiva el usuario auxiliar y trata de iniciar sesión con él.                                              | No puede iniciar sesión; sus registros históricos siguen visibles.         | Rechazo de acceso.       |
| S02-07 | Reactiva el usuario auxiliar e inicia sesión con sus credenciales.                                           | Recupera el acceso que permitan sus permisos.                              | Sesión iniciada.         |
| S02-08 | Desde la cuenta actual, intenta cambiar tu propio rol o desactivarte.                                        | La UI lo impide u oculta la acción; no debe autoeliminarse el acceso.      | Acción protegida.        |
| S02-09 | Con un usuario que tenga solo lectura, si existe en la matriz configurada, intenta una mutación mediante UI. | Las acciones de escritura no se muestran o son rechazadas por API con 403. | Pantalla/mensaje.        |

---

## Sprint 02.1 — Retroalimentación y recuperación UX

| ID      | Acción                                                                                              | Resultado esperado                                                                  | Evidencia             |
| ------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------- |
| S021-01 | Visita una ruta inexistente, por ejemplo `/ruta-inexistente`.                                       | Pantalla 404 comprensible y opción de volver.                                       | Pantalla 404.         |
| S021-02 | Abre una acción que requiera confirmación, como desactivar usuario o producto.                      | Diálogo accesible, foco en el diálogo, Cancelar y Confirmar claros.                 | Diálogo.              |
| S021-03 | Cancela la confirmación.                                                                            | No se aplica ningún cambio.                                                         | Registro sin cambios. |
| S021-04 | Provoca una consulta sin resultados con una búsqueda única inexistente.                             | Muestra estado vacío útil, no tabla rota ni error técnico.                          | Estado vacío.         |
| S021-05 | Con la API detenida temporalmente, recarga un listado; reinicia la API y usa Reintentar si aparece. | Muestra error de conexión comprensible y se recupera cuando la API vuelve.          | Error y recuperación. |
| S021-06 | Abre selectores dentro de modales y tablas.                                                         | Opciones completas, sin recortes; búsqueda y teclado funcionan cuando correspondan. | Selector abierto.     |

No detengas la API mientras otra persona realiza una operación de escritura.

---

## Sprint 03 — Clientes

| ID     | Acción                                                                                     | Resultado esperado                                                                              | Evidencia          |
| ------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------ |
| S03-01 | Crea un cliente natural con DNI único de 8 dígitos, nombres, apellidos y teléfono válidos. | Cliente creado y ficha navegable.                                                               | Código/ficha.      |
| S03-02 | Crea un cliente jurídico con RUC único de 11 dígitos y razón social.                       | Se muestran solo los campos aplicables al tipo jurídico.                                        | Ficha jurídica.    |
| S03-03 | Intenta guardar DNI/RUC incompleto, teléfono inválido o documento duplicado.               | Cada caso se rechaza sin crear registros.                                                       | Mensajes de campo. |
| S03-04 | Busca por documento completo, nombre/razón social y teléfono.                              | Documento completo identifica coincidencia exacta; texto/teléfono admiten coincidencia parcial. | Tres resultados.   |
| S03-05 | Edita contacto, nombre o correo del cliente natural.                                       | Cambios persistentes; el tipo no cambia durante edición.                                        | Ficha actualizada. |
| S03-06 | Abre la ficha antes de crear vehículos.                                                    | Vehículos e historial muestran vacío honesto, no datos inventados.                              | Estado vacío.      |

---

## Sprint 04 — Vehículos

| ID     | Acción                                                                                                        | Resultado esperado                                               | Evidencia             |
| ------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------- |
| S04-01 | Registra el vehículo principal con placa escrita como `qat-123`, marca, modelo, año válido y cliente natural. | Se guarda normalizada como `QAT123` y vinculada al propietario.  | Ficha de vehículo.    |
| S04-02 | Intenta registrar `QAT123` o `qat 123` para cualquier propietario.                                            | Rechazo por placa única.                                         | Mensaje de duplicado. |
| S04-03 | Busca por placa parcial, nombre y documento del propietario.                                                  | Devuelve solo vehículos relacionados.                            | Resultados.           |
| S04-04 | Edita marca, modelo o año.                                                                                    | Persiste el cambio; propietario permanece bloqueado e inmutable. | Ficha actualizada.    |
| S04-05 | Navega cliente → vehículo y vehículo → propietario.                                                           | Ambos enlaces llegan a la ficha correcta.                        | Navegación cruzada.   |

---

## Sprint 05 — Productos y catálogos

| ID     | Acción                                                                                         | Resultado esperado                                                                                  | Evidencia            |
| ------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------- |
| S05-01 | En **Productos**, abre Catálogos y crea una categoría, marca y unidad de prueba si no existen. | Se agregan y quedan activas para altas nuevas.                                                      | Catálogos.           |
| S05-02 | Edita uno de esos catálogos y luego desactívalo/reactívalo.                                    | Mantiene historial; inactivo no se ofrece para altas nuevas y reactivado vuelve a estar disponible. | Estado del catálogo. |
| S05-03 | Crea `QA-FILTRO-1015` con categoría, marca, unidad, precio no negativo y stock mínimo 3.       | Producto activo creado; stock se muestra de solo lectura.                                           | Ficha.               |
| S05-04 | Intenta código duplicado, precio negativo o un campo obligatorio vacío.                        | Rechazo claro, sin producto duplicado.                                                              | Validaciones.        |
| S05-05 | Busca por código, nombre y categoría; combina filtros si están disponibles.                    | Coincidencias coherentes y estado vacío para búsqueda inexistente.                                  | Resultados.          |
| S05-06 | Edita nombre o precio del producto.                                                            | Datos actuales cambian; no hay control para editar stock manualmente.                               | Ficha actualizada.   |
| S05-07 | Desactiva un producto que no usarás en las pruebas posteriores.                                | Sigue consultable históricamente y desaparece de selectores de nuevas operaciones.                  | Estado inactivo.     |

Conserva activo el producto operativo que usarás en inventario, venta y orden.

---

## Sprint 06 — Inventario y servicios

### Inventario

| ID     | Acción                                                             | Resultado esperado                                                                      | Evidencia                |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------ |
| S06-01 | Registra stock inicial `10` para el producto operativo.            | Existencia queda en 10 y se crea un único movimiento de stock inicial.                  | Existencias e historial. |
| S06-02 | Intenta registrar stock inicial nuevamente para el mismo producto. | Rechazo: el stock inicial solo se registra una vez.                                     | Mensaje.                 |
| S06-03 | Registra una entrada de `5`.                                       | Existencia sube a 15 y el historial registra usuario, fecha, tipo y cantidad.           | Historial.               |
| S06-04 | Registra una salida de `1`.                                        | Existencia baja a 14 y aparece una salida trazable.                                     | Stock antes/después.     |
| S06-05 | Intenta salida mayor que el saldo, cero o negativa.                | Rechazo; el stock no cambia.                                                            | Mensaje y saldo.         |
| S06-06 | Registra ajuste de ingreso y ajuste de egreso válidos.             | Signo, saldo y tipo se muestran correctamente.                                          | Historial.               |
| S06-07 | Deja el saldo en `3` o menos para activar alerta de mínimo.        | Muestra alerta textual de stock bajo, además del color.                                 | Alerta.                  |
| S06-08 | Filtra Historial por producto, tipo y período.                     | Las filas coinciden con el filtro; referencia sin función se muestra como `—`, no UUID. | Historial filtrado.      |

No reutilices el mismo producto para una prueba de salida grande que lo deje sin
stock antes de las pruebas de ventas y taller.

### Servicios

| ID     | Acción                                                               | Resultado esperado                                                   | Evidencia      |
| ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------- |
| S06-09 | Crea el servicio operativo con código único, nombre y precio válido. | Servicio activo disponible en selectores.                            | Ficha/listado. |
| S06-10 | Intenta código duplicado o precio negativo.                          | Rechazo y ausencia de duplicado.                                     | Mensaje.       |
| S06-11 | Edita el servicio y desactiva/reactiva uno que no usarás.            | El inactivo se conserva pero no aparece al crear nuevas operaciones. | Estado.        |

---

## Sprint 07 — Ventas

| ID     | Acción                                                                                                   | Resultado esperado                                                                                      | Evidencia                     |
| ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------- |
| S07-01 | Crea una venta en borrador sin cliente y agrega una línea válida.                                        | El cliente es opcional; el borrador conserva la línea.                                                  | Borrador.                     |
| S07-02 | En una nueva venta, selecciona el cliente natural, agrega el producto operativo y el servicio operativo. | Ambas líneas muestran precio congelado, cantidad, subtotal y total correctos.                           | Detalle.                      |
| S07-03 | Cambia cantidad y elimina una línea antes de confirmar.                                                  | Los subtotales y total se recalculan de inmediato.                                                      | Total actualizado.            |
| S07-04 | Intenta agregar producto sin stock suficiente.                                                           | No permite confirmar ni altera inventario.                                                              | Mensaje y stock.              |
| S07-05 | Confirma la venta con producto y servicio.                                                               | Estado `CONFIRMED`; descuenta el producto una sola vez; el servicio no genera movimiento de inventario. | Código de venta y movimiento. |
| S07-06 | Reintenta confirmar la misma venta o recarga su detalle.                                                 | No duplica salida ni descuenta por segunda vez.                                                         | Historial de inventario.      |
| S07-07 | Busca la venta por código, cliente y estado; abre detalle.                                               | Se muestran responsable, fecha, líneas e importes correctos.                                            | Ficha.                        |

Conserva esta venta confirmada y con saldo positivo para el Sprint 11.

---

## Sprint 08 — Citas

| ID     | Acción                                                                                                           | Resultado esperado                                                            | Evidencia             |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------- |
| S08-01 | Crea la cita principal para el cliente natural, su vehículo principal, fecha/hora futura y motivo.               | Cita `PROGRAMADA` con código y responsable.                                   | Detalle.              |
| S08-02 | Cambia de cliente tras seleccionar vehículo.                                                                     | El vehículo se limpia o se restringe a los vehículos del nuevo cliente.       | Selector.             |
| S08-03 | Intenta crear la misma cita para el mismo vehículo, fecha y hora.                                                | Rechazo por conflicto del vehículo aunque haya cupo general.                  | Mensaje.              |
| S08-04 | Intenta fecha pasada u hora ya transcurrida.                                                                     | No permite guardar.                                                           | Validación.           |
| S08-05 | Reprograma la cita a una hora libre.                                                                             | Actualiza fecha/hora y conserva historial de auditoría.                       | Detalle actualizado.  |
| S08-06 | Cancela una cita auxiliar.                                                                                       | Queda `CANCELADA`, consultable y deja libre el horario.                       | Filtro por estado.    |
| S08-07 | Con al menos nueve vehículos distintos, registra ocho citas activas en la misma fecha/hora e intenta una novena. | Las primeras ocho son válidas; la novena se rechaza por capacidad del taller. | Mensaje de capacidad. |

Para S08-07 usa citas auxiliares y conserva la cita principal programada para
el Sprint 09. La capacidad de 8 es por fecha y hora global, no por vehículo.

---

## Sprint 09 — Fundación de operación de taller

| ID     | Acción                                                                         | Resultado esperado                                                                   | Evidencia                |
| ------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------ |
| S09-01 | Abre la cita principal y pulsa **Atender y crear orden**.                      | La cita pasa a `ATENDIDA` y nace una sola `OT-######` con el mismo cliente/vehículo. | Cita y orden.            |
| S09-02 | Intenta atender la misma cita otra vez.                                        | No crea una segunda orden.                                                           | Acción oculta/rechazada. |
| S09-03 | Registra diagnóstico y guarda.                                                 | Orden queda `EN_DIAGNOSTICO`; texto y responsable visibles.                          | Ficha.                   |
| S09-04 | Asigna un técnico activo.                                                      | Técnico visible en detalle y trazabilidad de cambio.                                 | Ficha.                   |
| S09-05 | Agrega al presupuesto una línea de producto y una de servicio; guarda y envía. | Precio, cantidad, subtotal y total quedan congelados; estado `PENDIENTE_APROBACION`. | Presupuesto.             |
| S09-06 | Revisa Inventario antes/después de presupuestar.                               | No cambia stock ni genera salida.                                                    | Existencias/historial.   |
| S09-07 | Aprueba el presupuesto con observación.                                        | Estado `APROBADA`, responsable y fecha visibles; aún no descuenta stock.             | Orden aprobada.          |
| S09-08 | En una segunda orden auxiliar, rechaza el presupuesto.                         | Estado `RECHAZADA`, presupuesto y decisión quedan consultables.                      | Orden rechazada.         |

Conserva la orden aprobada para el Sprint 10.

---

## Sprint 10 — Ejecución, consumo y entrega

| ID     | Acción                                                            | Resultado esperado                                                           | Evidencia           |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| S10-01 | Desde la orden aprobada con técnico, pulsa **Iniciar ejecución**. | Estado `EN_EJECUCION`, fecha y responsable de inicio.                        | Orden.              |
| S10-02 | En una orden aprobada sin técnico, intenta iniciar.               | Rechazo claro; no cambia de estado.                                          | Mensaje.            |
| S10-03 | Registra dos actividades y márcalas completas.                    | Cronología, responsable y avance son visibles.                               | Actividades.        |
| S10-04 | Anota stock y consume 1 unidad del producto presupuestado.        | Crea un consumo y una sola salida `EXIT` ligada a la orden; stock baja en 1. | Orden e Inventario. |
| S10-05 | Intenta consumir más de lo presupuestado o disponible.            | Rechazo sin movimiento ni cambio de stock.                                   | Mensaje.            |
| S10-06 | Devuelve la unidad consumida.                                     | Crea `ADJUSTMENT_IN`, restaura stock y no borra la salida original.          | Historial.          |
| S10-07 | Consume nuevamente 1 unidad dentro del máximo presupuestado.      | Nueva salida válida y stock correcto.                                        | Historial final.    |
| S10-08 | Finaliza el trabajo cuando actividades y consumos sean válidos.   | Estado `LISTA_PARA_ENTREGA`; no permite nuevos consumos/actividades.         | Orden.              |
| S10-09 | Registra entrega con observación.                                 | Estado `ENTREGADA`; fecha, responsable y observación visibles; no crea pago. | Entrega.            |
| S10-10 | Abre historial del vehículo.                                      | Muestra la orden entregada, diagnóstico, técnico, actividades y repuestos.   | Ficha de vehículo.  |

---

## Sprint 11 — Cobros, saldos e historial de pagos

| ID     | Acción                                                                | Resultado esperado                                                                       | Evidencia              |
| ------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| S11-01 | Abre **Caja**, busca la venta confirmada de S07 y abre el detalle.    | Muestra total, pagado, saldo y estado `PENDIENTE`.                                       | Detalle de obligación. |
| S11-02 | Registra un pago parcial positivo, menor al saldo, con método válido. | Estado `PARCIALMENTE_PAGADA`; historial, usuario, fecha y método visibles.               | Pago parcial.          |
| S11-03 | Intenta monto cero, negativo o mayor al saldo.                        | Rechazo; saldo e historial no cambian.                                                   | Mensaje.               |
| S11-04 | Registra el importe restante exacto.                                  | Estado `PAGADA`, saldo `S/ 0.00`.                                                        | Pago final.            |
| S11-05 | Compensa una parte de un pago con motivo obligatorio.                 | El pago original no se edita ni desaparece; se agrega compensación y saldo se recalcula. | Historial cronológico. |
| S11-06 | Revisa Inventario antes/después de pago y compensación.               | Cobro no crea ni revierte movimientos de inventario.                                     | Historial de stock.    |
| S11-07 | Filtra Caja por búsqueda, estado, método y período.                   | Lista y chips coinciden con las obligaciones mostradas.                                  | Filtros.               |

---

## Sprint 12 — Consulta operativa

| ID     | Acción                                                                                | Resultado esperado                                                                                     | Evidencia     |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| S12-01 | Abre **Dashboard**.                                                                   | Solo muestra tarjetas y listas de fuentes para las que el usuario tiene permiso.                       | Dashboard.    |
| S12-02 | Contrasta citas, órdenes, ventas, saldos e inventario bajo con los módulos de origen. | Los números coinciden; no se inventan ceros cuando faltan permisos o datos.                            | Comparación.  |
| S12-03 | Aplica un período que incluya y luego excluya tus datos.                              | Citas, órdenes y ventas cambian según su fecha definida; caja/inventario reflejan su criterio visible. | Dos estados.  |
| S12-04 | Abre **Ver módulo** o una alerta de cada sección.                                     | Navega al módulo origen correcto sin UUIDs expuestos.                                                  | Navegación.   |
| S12-05 | Busca un período sin registros.                                                       | Muestra estado vacío claro y el Dashboard no ofrece acciones de mutación.                              | Estado vacío. |

---

## Sprint 13 — Inteligencia de negocio

| ID     | Acción                                                                                            | Resultado esperado                                                                                      | Evidencia       |
| ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| S13-01 | Abre **Reportes** con el período predefinido de últimos 30 días.                                  | Carga bloques autorizados, período visible e indicadores trazables.                                     | Página inicial. |
| S13-02 | Revisa bloque de **Ventas** y compáralo con ventas confirmadas de S07.                            | Cantidad, importe, series y desglose coinciden con la fuente.                                           | Comparación.    |
| S13-03 | Revisa **Cobros** y compáralo con Caja, incluidos pago parcial, pago final y compensación.        | Cobrado, saldo y estados coinciden con S11.                                                             | Comparación.    |
| S13-04 | Revisa **Inventario** y **Servicios**.                                                            | Stock bajo y movimientos derivan de los movimientos confirmados; servicio coincide con catálogo/ventas. | Bloques.        |
| S13-05 | Revisa **Taller**.                                                                                | Citas y órdenes por etapa incluyen los resultados de S08 a S10.                                         | Bloque.         |
| S13-06 | Cambia a período sin datos y luego a uno mayor de 31 días, si tu base posee historial suficiente. | Vacío claro; series cambian de granularidad diaria a semanal/mensual según el rango.                    | Dos períodos.   |
| S13-07 | Navega con teclado por gráficos y consulta su tabla equivalente.                                  | Valores, etiquetas y tabla son accesibles; no depende solo del color.                                   | Accesibilidad.  |
| S13-08 | Abre enlaces de desglose/drill-down.                                                              | Llegan al módulo de origen correcto y Reportes no ofrece crear, editar, cobrar ni mover stock.          | Navegación.     |

## 4. Comprobación transversal de permisos

Ejecuta esta sección solo si dispones de una cuenta con permisos restringidos
configurada legítimamente. No modifiques la matriz de permisos de producción
para esta prueba.

| Área                           | Lectura sin escritura                    | Resultado esperado                                                                 |
| ------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Usuarios                       | Sin `users:write`                        | No puede crear, editar, desactivar ni cambiar rol.                                 |
| Clientes/Vehículos             | Sin `customers:write` / `vehicles:write` | Puede consultar si tiene lectura; no guarda cambios.                               |
| Productos/Inventario/Servicios | Sin permisos `*:write`                   | No registra catálogo, movimientos ni servicios.                                    |
| Ventas/Citas/Taller/Caja       | Sin permisos de escritura                | No confirma, agenda, ejecuta, entrega ni cobra.                                    |
| Dashboard/Reportes             | Sin lectura de una fuente                | La sección se oculta o informa restricción; nunca muestra cero como si fuera dato. |

La API debe rechazar una mutación no autorizada con `403`, aunque alguien
intente invocar el endpoint fuera de la interfaz.

## 5. Rendimiento y registros técnicos

Mientras se realiza el recorrido, revisa el terminal de API. Para una
navegación o acción deben aparecer registros estructurados como:

```text
client_module_loaded
database_transaction_completed
http_request_completed
```

Verifica que incluyan `requestId`, `module`, `method`, `status` y
`durationMs`. Para medir una acción, anota los registros con el mismo
`requestId`; no copies cookies, cuerpos de solicitud ni contraseñas.

Un `401` en `GET /api/v1/auth/me` antes de iniciar sesión es normal. Un `401`
en `POST /api/v1/auth/login` indica credenciales inválidas, cuenta inactiva o
bloqueada; no es una falla de migración.

## 6. Criterio de cierre y reporte de incidencias

La prueba queda lista para aprobación cuando:

- todos los casos críticos de este documento pasan;
- los casos negativos no alteran datos;
- stock, precios, saldo y estados coinciden entre módulos fuente, Dashboard y
  Reportes;
- no hay errores de consola/API sin explicar;
- la evidencia está identificada por códigos funcionales, no por UUIDs;
- el usuario revisa y aprueba expresamente los incrementos pendientes.

Usa esta plantilla para una incidencia:

```text
Fecha/hora:
Sprint y caso (ej. S11-03):
Usuario usado:
Datos funcionales (venta/cita/orden):
Pasos realizados:
Resultado esperado:
Resultado observado:
Mensaje visible:
requestId y status HTTP (si existen):
Captura:
```

Al finalizar, actualiza las actas correspondientes solo con aprobación
expresa del usuario:

- `docs/03-sprints/sprint-11-payments/approval.md`
- `docs/03-sprints/sprint-12-operational-dashboard/approval.md`
- `docs/03-sprints/sprint-13-bi/approval.md`

Los planes específicos por sprint siguen siendo la fuente de detalle técnico:
consulta sus respectivos `acceptance-and-test-plan.md` para reglas y casos de
integración adicionales.
