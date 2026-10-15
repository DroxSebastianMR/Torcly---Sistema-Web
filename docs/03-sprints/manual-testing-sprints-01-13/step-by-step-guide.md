# Guía rápida paso a paso — Prueba integral Sprints 01 a 13

Esta es la guía para la persona que ejecutará la prueba. Sigue los pasos en
orden: cada módulo crea datos que serán utilizados por el siguiente.

Para reglas detalladas, pruebas negativas adicionales y evidencia completa,
consulta el [manual integral](README.md).

## 1. Antes de iniciar

1.  Abre una terminal en el worktree de pruebas:

    cd ~/OneDrive/Escritorio/capstone/Torcly---Sistema-Web-manual-testing

2.  Comprueba la rama:

        git branch --show-current

    **Debe mostrar:** testing/manual-sprints-01-13.

3.  Comprueba la base de datos e inicia la aplicación:

        pnpm db:check
        pnpm dev

    **Debe ocurrir:** web en http://127.0.0.1:5173 y API en el puerto 3000,
    sin errores de Prisma, URLs de ejemplo ni puerto ocupado.

4.  Abre la web e inicia sesión con los valores SEED_ADMIN_USERNAME o
    SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD de apps/api/.env.

    **Debe ocurrir:** aparece el Dashboard. El 401 de auth/me antes del login
    es normal; un 401 al intentar iniciar sesión requiere revisar credenciales.

## 2. Datos de prueba

Elige un sufijo que no exista. En este manual se usa 1015; reemplázalo si
algún dato ya está registrado.

| Recurso             | Valor de prueba                                          |
| ------------------- | -------------------------------------------------------- |
| Usuario auxiliar    | qa-manual-1015 / qa.manual.1015@torcly.local             |
| Contraseña auxiliar | TorclyQA2026!                                            |
| Cliente natural     | Cliente QA Manual 1015 y DNI único de 8 dígitos          |
| Cliente jurídico    | Talleres QA Manual 1015 S.A.C. y RUC único de 11 dígitos |
| Vehículo principal  | QAT123                                                   |
| Vehículo auxiliar   | QAT124                                                   |
| Producto            | QA-FILTRO-1015, precio S/ 42.50, mínimo 3                |
| Servicio            | QA-SERV-1015, precio S/ 195.00                           |

Anota los códigos reales que genere el sistema para la venta, cita y orden.
No uses información personal real ni hagas los intentos fallidos sobre la
cuenta administradora.

---

## 3. Acceso y usuarios

### Paso 1 — Comprobar que la sesión funciona

1. Luego de iniciar sesión, presiona F5.
2. Abre Clientes y vuelve al Dashboard.

**Esperado:** conserva la sesión y navega sin pedir login.

### Paso 2 — Crear el usuario auxiliar

1. Ve a **Usuarios** y pulsa **Nuevo usuario**.
2. Ingresa el usuario, correo y contraseña de la tabla anterior.
3. Asigna un rol existente y activo.
4. Guarda, busca el usuario y abre su detalle.
5. Edita únicamente el nombre visible y guarda.
6. Desactiva el usuario y confirma.
7. Cierra sesión e intenta entrar como ese usuario. Debe fallar.
8. Vuelve a entrar como administrador y reactiva al usuario auxiliar.

**Esperado:** alta, búsqueda, edición, desactivación y reactivación funcionan.
La cuenta desactivada no inicia sesión, pero sus datos se conservan.

### Paso 3 — Probar cierre de sesión y protección

1. Como administrador, abre tu propio detalle de usuario.
2. Intenta cambiar tu rol o desactivarte.
3. Cierra sesión, presiona Atrás y visita /clientes.

**Esperado:** no puedes quitarte tu propio acceso; después del logout ninguna
ruta protegida muestra datos.

---

## 4. Clientes y vehículos

### Paso 4 — Crear clientes

1. Ve a **Clientes** y pulsa **Nuevo cliente**.
2. Crea el cliente natural con DNI de 8 dígitos, nombres, apellidos y teléfono.
3. Crea el cliente jurídico con RUC de 11 dígitos y razón social.
4. Busca cada uno por documento, nombre/razón social y teléfono.
5. Intenta guardar un DNI/RUC duplicado o incompleto.

**Esperado:** ambos tipos se muestran con sus campos correctos. Las búsquedas
funcionan y los documentos inválidos o duplicados se rechazan.

### Paso 5 — Crear vehículos

1. Ve a **Vehículos** y pulsa **Registrar vehículo**.
2. Crea QAT123 para el cliente natural, ingresándolo como qat-123.
3. Crea QAT124 para el mismo cliente.
4. Busca por QAT, nombre y documento del propietario.
5. Edita marca o modelo de QAT123.
6. Intenta registrar qat 123 o QAT-123.
7. Navega cliente → vehículo y vehículo → propietario.

**Esperado:** la placa se guarda como QAT123, no admite variantes duplicadas y
la relación de propietario no se altera al editar.

---

## 5. Productos, inventario y servicios

### Paso 6 — Preparar catálogos y producto

1. Ve a **Productos** y abre **Catálogos de productos**.
2. Crea, si hace falta, categoría, marca y unidad activas.
3. Crea el producto QA-FILTRO-1015 con precio 42.50 y stock mínimo 3.
4. Busca por código, nombre y categoría.
5. Intenta crear el mismo código y luego un precio negativo.
6. Comprueba que no existe control para editar stock desde la ficha.

**Esperado:** el producto queda activo; duplicado y precio negativo se
rechazan; el stock solo se administra desde Inventario.

### Paso 7 — Crear servicio

1. Ve a **Servicios** y crea QA-SERV-1015, nombre Mantenimiento QA Manual
   1015 y precio 195.00.
2. Busca el servicio y abre su detalle.
3. Intenta un código duplicado o precio negativo.

**Esperado:** el servicio activo queda disponible y las entradas inválidas se
rechazan.

### Paso 8 — Registrar movimientos

1. Ve a **Inventario** → **Existencias**.
2. Registra stock inicial 10 para QA-FILTRO-1015.
3. Registra una entrada de 5.
4. Registra una salida de 1.
5. Abre **Historial** y filtra por el producto.
6. Intenta una salida mayor al saldo y otra con cantidad cero.
7. Registra ajuste de ingreso y ajuste de egreso válidos.

**Esperado:** después de los tres primeros movimientos el stock es 14. Cada
fila tiene tipo, cantidad, fecha y usuario. Los movimientos inválidos no
alteran el saldo.

---

## 6. Venta y cita

### Paso 9 — Crear la venta que se cobrará luego

1. Ve a **Ventas** y crea un borrador sin cliente con una línea de producto.
2. Crea una segunda venta seleccionando el cliente natural.
3. Añade QA-FILTRO-1015, cantidad 1.
4. Añade QA-SERV-1015, cantidad 1.
5. Revisa subtotal y total; confirma la venta.
6. Anota el código de venta.
7. Revisa el historial de Inventario.

**Esperado:** el borrador admite cliente vacío. La venta confirmada descuenta
exactamente una unidad del producto y no descuenta inventario por el servicio.

### Paso 10 — Crear cita principal

1. Ve a **Citas** y pulsa **Nueva cita**.
2. Selecciona cliente natural y QAT123.
3. Elige fecha y hora futuras; registra motivo de mantenimiento.
4. Guarda y anota el código de cita.
5. Intenta otra cita para QAT123 en la misma fecha y hora.
6. Crea una cita auxiliar, reprograma a una hora libre y cancélala.

**Esperado:** la cita principal queda PROGRAMADA. El mismo vehículo no puede
tener dos citas activas en la misma fecha/hora; fechas pasadas también fallan.

### Paso 11 — Capacidad de 8 citas (opcional)

1. Reúne nueve vehículos distintos.
2. Programa ocho citas activas para la misma fecha y hora.
3. Intenta programar una novena con el vehículo restante.

**Esperado:** ocho citas se aceptan y la novena se rechaza por capacidad de
taller. La capacidad es global por fecha y hora.

---

## 7. Taller: orden, ejecución y entrega

### Paso 12 — Convertir la cita en orden

1. Abre la cita principal.
2. Pulsa **Atender y crear orden**.
3. Anota el código OT generado.
4. Intenta atender la misma cita una segunda vez.

**Esperado:** la cita queda ATENDIDA y se crea una sola orden.

### Paso 13 — Diagnosticar, presupuestar y aprobar

1. Abre la orden en **Órdenes de taller**.
2. Registra este diagnóstico: Mantenimiento QA: revisión y cambio de filtro.
3. Asigna un técnico activo.
4. Agrega una línea QA-FILTRO-1015, cantidad 1.
5. Agrega una línea QA-SERV-1015, cantidad 1.
6. Guarda, envía y aprueba el presupuesto.
7. Consulta Inventario antes y después.

**Esperado:** la orden llega a APROBADA. Precios y totales quedan visibles y el
presupuesto no cambia inventario.

### Paso 14 — Ejecutar la orden

1. Pulsa **Iniciar ejecución**.
2. Registra y completa dos actividades:
   - Revisar sistema y retirar filtro.
   - Instalar filtro y verificar funcionamiento.
3. Anota stock y consume una unidad del producto presupuestado.
4. Comprueba la salida asociada en Inventario.
5. Devuelve la unidad desde la orden; verifica el ajuste de ingreso.
6. Consume nuevamente una unidad.

**Esperado:** la orden pasa a EN_EJECUCION. La devolución no borra la salida,
sino que genera un movimiento compensatorio. El consumo solo puede estar
dentro de presupuesto y stock disponible.

### Paso 15 — Finalizar y entregar

1. Pulsa **Finalizar trabajo**.
2. Comprueba LISTA_PARA_ENTREGA.
3. Registra entrega: Vehículo entregado y trabajo explicado.
4. Abre QAT123 y revisa su historial.

**Esperado:** la orden queda ENTREGADA, no acepta más consumos/actividades y
el historial muestra diagnóstico, técnico, actividades y repuestos.

---

## 8. Caja, Dashboard y Reportes BI

### Paso 16 — Cobrar la venta

1. Ve a **Caja** y busca la venta anotada.
2. Abre detalle y registra un pago parcial menor al saldo, por ejemplo 100.00.
3. Registra el importe restante exacto.
4. Comprueba estado PAGADA y saldo S/ 0.00.
5. Compensa parcialmente uno de los pagos, indicando motivo.
6. Revisa Inventario.
7. Intenta pago cero, negativo o superior al saldo.

**Esperado:** pago parcial deja saldo, pago final deja la venta pagada y la
compensación agrega un evento sin editar el pago original. Ninguno cambia el
inventario; importes inválidos se rechazan.

### Paso 17 — Revisar Dashboard

1. Abre **Dashboard**.
2. Compara citas, órdenes, ventas, cobros e inventario bajo con sus módulos.
3. Cambia a un período que incluya tus datos y luego a uno sin datos.
4. Pulsa enlaces de detalle o **Ver módulo**.

**Esperado:** los indicadores coinciden con sus fuentes. El Dashboard es solo
consulta, muestra vacíos comprensibles y no expone UUID.

### Paso 18 — Revisar BI

1. Abre **Reportes** con el período de últimos 30 días.
2. Revisa Ventas contra la venta confirmada.
3. Revisa Cobros contra pago parcial, pago final y compensación.
4. Revisa Inventario, Servicios y Taller contra los datos creados.
5. Cambia a un período sin datos.
6. Navega por un gráfico con teclado y abre su tabla equivalente.

**Esperado:** cada bloque es trazable a su módulo fuente, los períodos se
aplican correctamente, los vacíos no son errores y Reportes no permite mutar
datos.

---

## 9. Cierre

1. En el terminal de API busca eventos client_module_loaded,
   database_transaction_completed y http_request_completed.
2. Confirma que incluyen requestId, módulo, status y durationMs.
3. Guarda capturas de venta, inventario, cita/orden, Caja, Dashboard y
   Reportes.
4. Si un paso falla, anota: paso, datos usados, esperado, observado, mensaje,
   status HTTP, requestId y captura.
5. No marques como aprobados los Sprints 11, 12 y 13 hasta contar con
   aprobación expresa del responsable.
