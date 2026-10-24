# Auditoría inicial de rendimiento y experiencia operativa

Fecha: 23/10/2026  
Alcance: revisión estática del flujo web/API y medición local no autenticada.  
Estado: diagnóstico inicial; pendiente completar la captura autenticada con datos de la base de desarrollo.

## Objetivo

Reducir la espera al abrir módulos y al completar operaciones, sin debilitar permisos, validaciones, auditoría, idempotencia, transacciones ni reglas de stock, cobro o taller.

## Línea base disponible

Con API y web locales ya iniciadas, cinco solicitudes locales no autenticadas dieron los siguientes órdenes de magnitud:

| Ruta                             | Resultado    | Tiempo observado                             |
| -------------------------------- | ------------ | -------------------------------------------- |
| `GET /login` (Vite)              | 200          | primera carga ~173 ms; posteriores ~8--12 ms |
| `GET /api/v1/health`             | 200          | ~2--12 ms                                    |
| `GET /api/v1/auth/me` sin sesión | 401 esperado | ~3--20 ms                                    |

Esto no reproduce la carga funcional de módulos ni autoriza a concluir que la base de datos remota sea rápida. Sí descarta que Vite, el proceso API o el circuito local básico expliquen por sí solos esperas de 6--10 segundos.

## Incidencia de infraestructura detectada durante la auditoría

Al intentar iniciar sesión durante la medición, Prisma devolvió `Connection terminated due to connection timeout`; la solicitud `POST /auth/login` tardó aproximadamente **10 098 ms** y respondió 500. La configuración tiene `DATABASE_CONNECT_TIMEOUT_MS=10000`.

La URL de pool configurada resuelve al proveedor administrado, pero las comprobaciones TCP locales fallaron hacia sus dos puertos configurados: pool `6543` y conexión directa `5432`. No se expone ninguna credencial en este documento.

**Conclusión:** mientras esta red no alcance PostgreSQL, ninguna optimización de consultas corregirá el tiempo de inicio de sesión ni permitirá una línea base autenticada confiable. Se debe comprobar primero la conectividad/red permitida del proveedor y, luego, repetir la medición de módulos. Reducir el timeout solo haría que el error aparezca antes; no recupera la conexión.

## Captura autenticada posterior

La conexión se recuperó temporalmente y permitió iniciar sesión. La primera captura del Dashboard confirmó las hipótesis de carga redundante:

| Evento                                    | Resultado observado                                                                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/auth/login`                 | 200 en **5 760 ms**; transacción de BD en **2 334 ms**.                                                                                                                                                                                  |
| `GET /api/v1/maintenance` desde el layout | 500 en ~**1 350 ms**. La base actual no contiene `maintenance_windows`, tabla de la migración `20261021000000_add_password_reset_and_maintenance`.                                                                                       |
| `GET /api/v1/operations/summary`          | 200 en **4 739 ms**.                                                                                                                                                                                                                     |
| Atención del Dashboard                    | Se dispararon cinco solicitudes simultáneas. Cuatro primeros intentos respondieron 500 entre **5 475--5 660 ms**; React Query reintentó y los resultados posteriores quedaron entre **6 170 ms** y transacciones de **2 729--3 269 ms**. |
| Métrica cliente de Dashboard              | Informó 407 ms; no refleja la espera del resumen ni las listas de atención.                                                                                                                                                              |

La configuración de pool de la API es `DATABASE_POOL_SIZE=5`. El resumen operacional ejecuta cinco transacciones concurrentes y, al mismo tiempo, el Dashboard inicia cinco atenciones, mantenimiento y métrica cliente. La evidencia es consistente con cola/saturación del pool y trabajo duplicado. La causa exacta de cada 500 aún no está clasificada porque el log de error solo conserva `INTERNAL_ERROR`; la respuesta pública debe continuar genérica, pero el log seguro de servidor debe registrar una categoría técnica sanitizada.

### Bloqueos que deben resolverse antes de una medición comparativa

1. Aplicar la migración pendiente que crea `maintenance_windows` a la base de desarrollo correcta. Esto requiere autorización explícita porque modifica el esquema remoto.
2. Corregir la carga inicial del Dashboard para que no abra cinco atenciones en paralelo.
3. Corregir la instrumentación de ruta y agregar clasificación técnica segura de errores de infraestructura/pool.

## Correcciones P0 aplicadas durante la auditoría

Las siguientes correcciones no modifican reglas de negocio, saldos, permisos ni datos:

1. **Dashboard:** dejó de consultar los cinco endpoints de atención al montar. Las tarjetas usan el contador ya presente en el resumen; el detalle sigue estando disponible desde cada módulo de origen.
2. **Inventario:** Historial y opciones de productos se habilitan al entrar a Historial o abrir el diálogo de movimiento, respectivamente. La captura posterior mostró solo `GET /inventory/existencia` al entrar en Existencias.
3. **Formularios montados pero cerrados:** los catálogos de Venta y Presupuesto de orden, los clientes de Nueva venta y los propietarios de Vehículo se habilitan únicamente al abrir su diálogo. React Query conserva su caché para aperturas siguientes.
4. **Observabilidad:** el middleware conserva el `originalUrl` normalizado, de modo que rutas montadas como `GET /api/v1/auth/me` se registran bajo `auth` y no bajo `unknown`.
5. **Migración de mantenimiento:** con autorización del usuario se aplicó `20261021000000_add_password_reset_and_maintenance`. La tabla `maintenance_windows` fue consultada después mediante Prisma y resultó accesible (0 registros); los 500 anteriores pertenecen a la captura previa.

## Capturas por módulo tras la primera corrección

| Módulo                   | Solicitudes funcionales observadas al entrar                                 | Tiempo HTTP observado | Nota                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------- | --------------------: | ------------------------------------------------------------------------------------------------------- |
| Dashboard                | resumen operacional (sin las cinco atenciones)                               |             ~4 075 ms | La mejora eliminó la fan-out de atención; falta optimizar las cinco transacciones internas del resumen. |
| Inventario / Existencias | existencia                                                                   |             ~2 764 ms | Ya no pidió historial ni opciones ocultas.                                                              |
| Ventas                   | lista de ventas; además clientes por formulario cerrado en la captura previa | ~3 956 ms / ~3 534 ms | La carga diferida de clientes se aplicó después de esta captura y debe re-medirse.                      |
| Caja                     | obligaciones de pago                                                         |             ~2 451 ms | La consulta aún carga obligaciones en memoria; es candidata P1 de backend.                              |
| Órdenes de taller        | lista y técnicos para filtro                                                 |             ~5 150 ms | Técnicos se requiere para el filtro; la lista requiere revisión de repositorio y conteos.               |

Los tiempos incluyen latencia de red y espera de pool del entorno de desarrollo; no se deben presentar como una línea base de producción.

## Correcciones P1 aplicadas después de la captura

1. **Saldo de inventario:** Existencias ahora obtiene `SUM(quantity)` agrupado por producto y tipo, y la fecha más reciente por producto. Ya no descarga todos los movimientos del kardex para calcular una página.
2. **Operaciones que cambian stock:** registrar movimiento, confirmar venta, consumir y devolver repuestos consultan el saldo agrupado dentro de su misma transacción y después de adquirir el advisory lock. Se conservan validación de stock, idempotencia y auditoría.
3. **Catálogo de ventas:** el stock disponible se calcula con agregados por producto/tipo; abrir Nueva venta no crecerá linealmente con el kardex histórico.
4. **Órdenes de taller:** el resumen de estados cambió de nueve conteos a un solo `groupBy(status)` y se obtiene en paralelo con los nombres de responsables una vez cargada la página.

Verificación automatizada posterior: API `typecheck`, `lint` y **316 pruebas aprobadas** (109 de integración omitidas sin base de pruebas). `format:check` y `git diff --check` también quedaron correctos.

La API se reinició por el modo watch tras estos cambios. Se necesita una nueva navegación a Inventario, Ventas y Órdenes para comparar sus tiempos post-P1 en los logs; no se atribuirán a estas correcciones los valores capturados antes del reinicio.

## Primera medición post-P1

| Ruta                               | Antes de P1 | Después de P1 | Lectura responsable                                                                                          |
| ---------------------------------- | ----------: | ------------: | ------------------------------------------------------------------------------------------------------------ |
| `GET /api/v1/work-orders`          |   ~5 438 ms | **~3 647 ms** | Reducción aproximada del 33 % al consolidar el resumen de estados.                                           |
| `GET /api/v1/inventory/existencia` |   ~2 646 ms |     ~2 789 ms | Con pocos datos la latencia de red/pool domina; el cambio evita el crecimiento lineal por kardex al escalar. |
| `GET /api/v1/sales`                |   ~2 510 ms |     ~3 036 ms | Variación de entorno; la consulta no precarga clientes ni catálogo.                                          |
| `GET /api/v1/operations/summary`   |   ~2 992 ms |     ~3 757 ms | Aún usa cinco lecturas autorizadas; debe optimizarse como siguiente prioridad si persiste la demora.         |

La captura también mostró una segunda consulta de Inventario, Ventas y Órdenes cuya petición cliente se aborta. Es la doble ejecución de montaje de `React.StrictMode` en el servidor de desarrollo de Vite: la API ya había empezado la consulta, por eso consume pool aunque el navegador no utilice la respuesta. Se retiró ese envoltorio del punto de entrada local para que `pnpm dev` mida y ejecute una sola carga por vista. Esto no elimina validaciones ni cambia el comportamiento funcional de producción.

## Incidencia posterior: Dashboard bajo presión de pool

En una nueva captura, `GET /operations/summary` respondió primero 500 en ~3 950 ms y React Query reintentó; el segundo intento respondió 200 en ~3 171 ms. Más tarde Prisma reportó `Connection terminated unexpectedly` en una solicitud de telemetría. La evidencia no apunta a un error de renderizado: coincide con presión o inestabilidad de la conexión administrada.

Correcciones aplicadas para reducir la contención inicial:

1. La métrica de navegación se sigue enviando con los mismos campos permitidos, pero se difiere 3 segundos; no compite con autenticación, mantenimiento y resumen al abrir un módulo.
2. Las consultas de solo lectura que forman el resumen (citas, órdenes, ventas, obligaciones y alertas de stock) ya no abren transacciones interactivas. Las transacciones siguen obligatorias para altas, cambios de stock, pagos y demás operaciones mutables.
3. La doble carga de desarrollo quedó eliminada. La siguiente captura debe contener una única solicitud funcional por ruta, más la telemetría diferida.

Persisten como riesgo externo la latencia y las terminaciones de la conexión de PostgreSQL. Si vuelven a ocurrir tras esta reducción de carga, se debe revisar la cuota/concurrencia del pool del proveedor y la red, sin aumentar ni exponer credenciales desde el cliente.

## Hallazgos priorizados

### P0 — solicitudes evitables al abrir pantallas

| Hallazgo                                                                         | Evidencia                                                                                                                                         | Impacto                                                                                        | Corrección propuesta                                                                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard carga listas de atención para cada tarjeta                             | `dashboard-page.tsx` monta `SummaryCard` por sección y cada tarjeta llama `useOperationsAttention`. Con permisos completos: 1 resumen + 5 listas. | La primera vista puede hacer seis solicitudes y repetir cálculos pesados de caja e inventario. | Mostrar `attentionCount`, ya calculado en el resumen, en la tarjeta. Cargar el detalle solo al abrir la tarjeta o una sección de atención explícita. |
| Inventario pide historial y opciones de productos aunque se muestra Existencias  | `inventory-page.tsx` invoca sin condición `useMovements` y `useInventoryProductOptions` con vista inicial `existence`.                            | Dos consultas que el usuario no pidió; una recorre el kardex.                                  | Añadir `enabled` a los hooks. Cargar historial al elegir Historial y opciones al abrir un diálogo de movimiento.                                     |
| Catálogos de venta y presupuesto se cargan al montar el diálogo, incluso cerrado | `sale-form-modal.tsx` usa `useSaleCatalog()` sin condición; `work-order-budget-modal.tsx` usa `useWorkOrderCatalog()` sin condición.              | Transferencia/cálculo anticipado que empeora la entrada a los módulos.                         | Habilitar catálogos solo mientras el diálogo está abierto; mantener caché de React Query para aperturas posteriores.                                 |

### P0 — lecturas de inventario que crecen con el historial

| Hallazgo                                                                     | Evidencia                                                                                                                 | Riesgo al escalar                                                                | Corrección propuesta                                                                                                                                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existencias obtiene movimientos individuales de cada producto de la página   | `inventoryRepository.listExistence()` hace `findMany` de movimientos para los productos listados y calcula stock en Node. | Cada producto con más historial incrementa datos transferidos y trabajo de Node. | Sustituir por `groupBy(productId,type)` con `_sum(quantity)` y obtener fecha más reciente con una agregación/consulta acotada.                                                                               |
| Registrar un movimiento lee todo el historial confirmado del producto        | `inventoryRepository.registerMovement()` usa `findMany` antes de `computeStock`.                                          | Una entrada/salida se degrada con los años de kardex.                            | En una primera mejora, calcular saldo mediante agregados por tipo dentro de la misma transacción y lock. A mediano plazo, evaluar una tabla de saldos materializados con backfill y pruebas de consistencia. |
| Confirmar venta repite la lectura completa por cada producto                 | `salesRepository.confirm()` obtiene todos los movimientos confirmados por producto.                                       | Ventas con varios productos multiplican las lecturas históricas.                 | Reutilizar un helper de saldo agregado por tipo, conservando el advisory lock, la validación y la auditoría.                                                                                                 |
| Catálogo de ventas trae todos los movimientos de todos los productos activos | `salesRepository.getCatalog()` carga productos activos y movimientos confirmados completos para calcular stock.           | Es uno de los candidatos más fuertes a demoras al abrir Nueva venta.             | Usar agregados por producto/tipo; considerar paginación/búsqueda remota de catálogo cuando aumente el catálogo.                                                                                              |

### P1 — caja y panel operacional

| Hallazgo                                                                                  | Evidencia                                                                                         | Impacto                                                           | Corrección propuesta                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caja carga todas las ventas confirmadas y sus pagos para luego filtrar/paginar en memoria | `paymentsRepository.listObligations()` hace dos `findMany` sin paginación y agrupa pagos en Node. | Crecimiento lineal con ventas y pagos; se repite desde Dashboard. | Mover el cálculo de saldo, filtros y paginación a una agregación SQL/Prisma acotada. Mantener saldo derivado en servidor.                           |
| Dashboard repite cálculos de obligaciones y bajo stock                                    | `operations.service.ts` calcula estos datos tanto en resumen como en atención.                    | Trabajo duplicado en una misma apertura.                          | Evitar la llamada de atención inicial; después exponer una consulta agregada reutilizable para contador/importe y cargar detalle solo bajo demanda. |

### P1 — observabilidad incompleta

| Hallazgo                                                            | Evidencia                                                                                                                          | Impacto                                                                               | Corrección propuesta                                                                                                                                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Algunas solicitudes se registran con `module: unknown` y ruta `/me` | `request-timing.ts` usa `request.path`/`request.route` al finalizar; al desmontarse el router se pierde el prefijo `/api/v1/auth`. | No se puede atribuir con confianza una demora al módulo responsable.                  | Capturar al inicio `originalUrl` normalizada y resolver módulo desde `/api/v1/<módulo>`; cubrirlo con tests.                                                                            |
| La métrica cliente mide navegación, no “datos listos”               | `app-layout.tsx` usa `useNavigation`; las consultas React Query de una ruta no necesariamente cambian ese estado.                  | Un registro de “módulo cargado” puede ser bajo aunque la tabla tarde varios segundos. | Medir por pantalla: inicio de ruta, primera consulta útil resuelta, error y datos visibles. Reportar solo metadatos permitidos y mantener `requestId`, ruta normalizada y `durationMs`. |

## Simplificación funcional a validar con el administrador

No se recomienda eliminar pasos que son controles de negocio (confirmar venta, aprobar presupuesto, pago/compensación, entrega de orden o validación de stock). Antes de cambiar flujos se validarán estas simplificaciones seguras:

1. Carga diferida de listas y catálogos: el administrador solo espera por los datos que decidió usar.
2. Acciones principales visibles por fila o detalle, con una sola confirmación para acciones irreversibles y sin diálogos intermedios vacíos.
3. Filtros con búsqueda diferida y resultados previos visibles durante la actualización.
4. Mensajes de estado que expliquen qué está cargando y permitan reintentar, sin presentar una pantalla vacía como si fuera un error.

## Orden recomendado de implementación

1. Corregir la medición y capturar una línea base autenticada por módulo.
2. Eliminar solicitudes iniciales innecesarias de Dashboard e Inventario; verificar con pruebas de componentes y red.
3. Reemplazar lecturas de movimientos completos por agregados por tipo en existencias, catálogo, venta y movimientos; medir antes/después con una base de prueba que incluya historial suficiente.
4. Rediseñar la consulta de obligaciones de Caja para que filtros y paginación se resuelvan en base de datos.
5. Solo después, evaluar saldo materializado de inventario. Esta alternativa exige migración, backfill, invariantes transaccionales e integración concurrente; no debe hacerse como optimización rápida.

## Criterios de aceptación de la próxima iteración

- Dashboard autenticado: una solicitud de resumen inicial; detalle bajo demanda.
- Inventario en Existencias: no solicitar historial ni opciones de diálogo hasta necesitarlos.
- Ninguna operación crítica pierde bloqueo, idempotencia, permisos, auditoría o cálculo autoritativo de servidor.
- Logs con módulo y ruta correctos, sin credenciales, tokens, cuerpos ni PII innecesaria.
- Evidencia antes/después: tiempo de respuesta API, tiempo de transacción y tiempo desde navegación hasta datos visibles.

## Extensión de auditoría: todos los módulos de lectura

La revisión se extendió a Clientes, Vehículos, Productos, Servicios, Usuarios,
Citas, Ventas, Órdenes de taller, Inventario, Reabastecimiento, Reportes y
autenticación. El criterio aplicado fue concreto: una consulta de lectura no
debe abrir una transacción interactiva ni ejecutar consultas de otra pestaña o
diálogo que el usuario aún no eligió abrir. Las altas, cambios de estado,
movimientos, cobros, consumos, devoluciones y auditorías **conservan** sus
transacciones, bloqueos e idempotencia.

### Correcciones aplicadas

| Área                   | Corrección                                                                                                                                                            | Efecto esperado                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Listas administrativas | Clientes, Vehículos, Productos, Servicios, Usuarios, Citas, Ventas y Órdenes obtienen página y total con consultas de solo lectura, sin `BEGIN`/`COMMIT` interactivo. | Menos ocupación del pool y menor latencia fija por pantalla.                                           |
| Citas                  | El resumen usa un `groupBy(status)` más el conteo de hoy; la página y el resumen se solicitan en paralelo.                                                            | Sustituye cuatro conteos por dos operaciones y evita espera secuencial.                                |
| Inventario             | Existencias e Historial son lecturas directas; Existencias conserva agregados por producto/tipo y fecha más reciente.                                                 | El kardex no se descarga completo y las vistas no retienen transacciones.                              |
| Taller                 | Lista, resumen y catálogo de presupuesto son lecturas directas; productos y servicios del presupuesto se validan en paralelo.                                         | Menos espera al listar y al preparar presupuestos con varias líneas.                                   |
| Ventas                 | Página de ventas es lectura directa; las líneas de una venta se validan en paralelo antes de crear/editar.                                                            | La duración ya no crece por esperar cada producto o servicio de forma secuencial.                      |
| Reabastecimiento       | Solo se consulta Recomendaciones o Historial según la pestaña visible.                                                                                                | Al entrar no se ejecuta la segunda consulta que el usuario no ve.                                      |
| BI                     | Cada bloque de Reportes se consulta cuando se aproxima al área visible (`IntersectionObserver`, margen 240 px).                                                       | Evita que cinco análisis compitan al abrir la página; los bloques inferiores se cargan al desplazarse. |
| Sesión                 | Todas las peticiones aún validan sesión y permisos, pero la renovación de actividad se escribe como máximo una vez por minuto por sesión.                             | Se eliminan escrituras repetidas de `auth_sessions` sin perder expiración por inactividad.             |

### Verificación de esta extensión

- API: `typecheck` y `lint` correctos; pruebas focalizadas de autenticación,
  citas, inventario, ventas, órdenes y usuarios: **68 aprobadas**.
- Web: `typecheck`, `lint`, build y pruebas focalizadas de Reportes y
  Reabastecimiento: **15 aprobadas**.
- Formato: `pnpm format:check` y `git diff --check` correctos.

### Cómo completar la evidencia real

1. Con la API en ejecución, entrar una vez a cada módulo de la lista anterior.
2. Anotar de los logs `http_request_completed` únicamente las rutas
   funcionales, sin contar `metrics/module-load` como tiempo de datos listos.
3. En Reportes, verificar que inicialmente se cargan los bloques visibles y que
   los inferiores empiezan al desplazarse.
4. En Reabastecimiento, comprobar que cambiar de Recomendaciones a Historial
   activa su consulta en ese momento, no al primer montaje.
5. Si una ruta continúa por encima del objetivo, capturar el tiempo junto con
   la ruta y estado HTTP. Latencias persistentes de varios segundos con pocos
   datos deben revisarse además en el pool/red de PostgreSQL administrado.
