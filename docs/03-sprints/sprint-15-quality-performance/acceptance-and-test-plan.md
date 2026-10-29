# Plan de aceptación - Sprint 15 Calidad, rendimiento y experiencia

## Estado

Implementado; pendiente de prueba manual. Los tests automatizados y la verificación
técnica están en verde (ver README del Sprint 15). Este documento define la evidencia
mínima que debe existir antes de aprobar HU-81, HU-82, HU-86, HU-89 y HU-90. La guía
`measurement-guide.md` describe el método repetible; aquí se registran los resultados.

## Preparación controlada

1. Usar la base de desarrollo con migraciones aplicadas y una cuenta administrativa; no usar producción.
2. Iniciar API y web locales, registrar fecha, equipo, navegador, URL y rama probada.
3. Abrir DevTools solo para leer Network/Console; no copiar tokens, cookies ni datos sensibles a las evidencias.
4. Usar datos de la guía manual de Sprints 01 a 13 o equivalentes para que existan clientes, vehículos, productos, citas, ventas, pagos, órdenes y BI.
5. Repetir cada medición al menos tres veces después de una primera ejecución de calentamiento. Registrar mediana y máximo observados, no solo el mejor resultado.

## Escenarios de rendimiento

| Caso               | Acción                                                                                    | Umbral                                                 | Evidencia esperada                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Operación habitual | Iniciar sesión y abrir Clientes, Vehículos, Productos, Citas, Órdenes y Caja.             | Hasta 3 s por operación objetivo.                      | Tabla con acción, intentos, mediana, máximo, estado HTTP y `requestId`.                           |
| Escritura habitual | Crear un cliente, vehículo, producto y cita válidos; luego confirmar una venta de prueba. | Hasta 3 s, sin omitir validación/persistencia.         | Registro de creación, `durationMs`, código creado y consulta posterior que confirme persistencia. |
| BI                 | Abrir Reportes con últimos 30 días y cambiar el período.                                  | Hasta 5 s por carga del bloque/página aprobada.        | Captura de la respuesta, período, criterios/fuentes visibles y mediciones.                        |
| Error controlado   | Enviar documento, placa, código, cantidad o pago inválido.                                | Respuesta comprensible sin meta de tiempo contractual. | Campo marcado, mensaje, estado HTTP y confirmación de que no hubo cambio de datos.                |

Un tiempo aislado superior al umbral no se oculta: se registra con el escenario y se diagnostica antes de aprobar la historia correspondiente. Los resultados locales no equivalen a un SLA de producción.

## Validación de datos y experiencia

| Caso                       | Acción                                                                                | Resultado esperado                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Cliente/vehículo duplicado | Repetir DNI, RUC o placa normalizada.                                                 | Cliente y API explican el conflicto; no se crea un duplicado.                           |
| Producto/inventario        | Usar código duplicado, precio/cantidad inválida o salida sin saldo.                   | Se bloquea antes de persistir o API rechaza; stock no cambia en casos inválidos.        |
| Cita/pago                  | Intentar horario incompatible, novena cita activa, pago cero/negativo/mayor al saldo. | Mensaje claro y el estado anterior se conserva.                                         |
| Acción crítica             | Cancelar o confirmar eliminación, compensación, entrega u otra acción irreversible.   | El diálogo nombra consecuencia y destino; cancelar no altera datos.                     |
| Estados                    | Forzar búsqueda vacía, carga, error de red controlado y acceso sin permiso.           | Cada estado es visible, legible y ofrece una acción de recuperación cuando corresponde. |

## Compatibilidad y accesibilidad

1. En Chrome y Edge actuales, recorrer Login, Clientes, Vehículos, Productos, Inventario, Ventas, Citas, Taller, Caja, Dashboard, Reportes y Reabastecimiento.
2. Repetir los flujos principales a 1280 px y 768 px de ancho. No debe haber controles inaccesibles, desborde horizontal no intencional ni diálogos recortados.
3. Usar `Tab`, `Shift+Tab`, `Enter`, `Space` y `Escape` en formularios, selectores, diálogos, filtros y tabla/gráfico BI. El foco debe permanecer visible y los diálogos deben devolverlo al control que los abrió.
4. Comprobar que color no sea la única señal de error, estado, prioridad o stock bajo; iconos y botones deben tener texto o nombre accesible.

## Evidencia de cierre

- Hoja con mediciones, entorno y `requestId` de cada escenario medido.
- Capturas de laptop/tablet y de los estados de validación/error/confirmación.
- Resultado de `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm format:check` y `git diff --check`.
- Confirmación manual expresa del responsable; sin ella el acta permanece en “Listo para prueba del usuario”.
