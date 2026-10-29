# Guía de medición reproducible - Sprint 15

Esta guía describe **cómo** medir tiempos y experiencia del Sprint 15. No contiene
números absolutos: cada medición se registra con su escenario, entorno y fuente de
datos. Un resultado local no es un SLA de producción.

## Fuente de los datos

- Los tiempos de API provienen del evento estructurado `http_request_completed`
  emitido por el middleware de duración. Campos permitidos: `requestId`, `module`,
  `operation`, `method`, `route` (ruta normalizada), `status` y `durationMs`.
- La ruta se normaliza (`/api/v1/customers/:uuid`, `/api/v1/products/:id`), de modo
  que la medición agrupa operaciones sin exponer identificadores.
- La telemetría **nunca** registra contraseñas, cookies, tokens, cabeceras de
  autorización, cuerpos de solicitud ni documentos completos.
- La carga de módulos en la web se envía a un endpoint interno
  (`/api/v1/metrics/module-load`) y no bloquea la navegación ni llama a terceros.

## Preparación del entorno

1. Usa la base de desarrollo con migraciones aplicadas y una cuenta administrativa;
   no uses producción.
2. Levanta API y web locales. Registra fecha, equipo, navegador, ancho de ventana,
   rama (`feature/sprint-15-quality-performance`) y `NODE_ENV`.
3. Abre DevTools solo para leer Network/Console. No copies tokens, cookies ni datos
   sensibles a la evidencia.
4. Carga datos de la guía manual de Sprints 01 a 13 (o equivalentes): clientes,
   vehículos, productos, citas, ventas, pagos, órdenes y BI.
5. Cada escenario: una ejecución de calentamiento y luego **al menos tres**
   ejecuciones medidas. Reporta mediana y máximo, nunca solo el mejor valor.

## Método por escenario

| Paso | Acción                                                                | Registro obligatorio                                                 |
| ---- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1    | Ejecutar la operación objetivo (login, abrir módulo, crear registro). | `requestId`, módulo, operación, estado HTTP y `durationMs`.          |
| 2    | Repetir tres veces sin cambiar datos ni entorno.                      | Cada corrida con su `durationMs`.                                    |
| 3    | Calcular mediana y máximo.                                            | Tabla por acción.                                                    |
| 4    | Contrastar con el umbral (3 s habituales, 5 s BI).                    | Veredicto: dentro/fuera; si fuera, registrar diagnóstico.            |
| 5    | Confirmar efecto funcional.                                           | Persistencia/consulta posterior; la medición no sustituye la prueba. |

## Escenarios

### HU-81 - Operaciones habituales (hasta 3 s)

Login y apertura de Clientes, Vehículos, Productos, Citas, Órdenes y Caja; escritura
de cliente, vehículo, producto, cita y confirmación de venta. Además de la respuesta,
confirma persistencia y autorización.

### HU-82 - BI / Reportes (hasta 5 s)

Abre Reportes con los últimos 30 días y cambia el período. Registra período,
criterios/fuentes visibles y la medición del bloque/página aprobada.

### HU-86 - Validación (sin meta de tiempo contractual)

Envía documento, placa, código, cantidad o pago inválido. Verifica campo marcado,
mensaje comprensible, estado HTTP y que **no** hubo cambio de datos.

### HU-89 - Mensajes, confirmaciones y estados

Verifica confirmaciones de acciones críticas (cancelar, compensar, entregar) con
consecuencia explícita y cancelación sin mutación; y los estados loading, empty,
error y restricted con acción de recuperación cuando corresponde.

### HU-90 - Compatibilidad y accesibilidad

Chrome y Edge actuales (Firefox como contraste si está disponible). Repite los
flujos a 1280 px y 768 px. Recorre con `Tab`, `Shift+Tab`, `Enter`, `Space` y
`Escape`; el foco debe ser visible y los diálogos devolverlo al control de origen.
Comprueba que color no sea la única señal de error, estado o stock bajo.

## Registro de evidencia

- Tabla de mediciones con escenario, entorno y `requestId`.
- Capturas de laptop/tablet y de los estados de validación/error/confirmación.
- Resultado de `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`,
  `pnpm format:check` y `git diff --check`.
- Sin confirmación manual expresa, el avance no cambia: el acta permanece en
  “Listo para prueba del usuario”.
