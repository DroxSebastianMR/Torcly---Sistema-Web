# Hoja de ruta al 100%

## Regla de avance

El avance se calcula exclusivamente con historias aprobadas del Product Backlog:

`historias aprobadas / 92 × 100`

Una historia no recibe porcentaje parcial. Una tarea técnica, migración, prueba o ajuste visual solo cuenta dentro de la historia que habilita y cuando cumple la [Definition of Done](../04-calidad/definition-of-done.md).

Al cierre del Sprint 09 hay **46 de 92 historias aprobadas (50,00%)**. Esta hoja de ruta ordena las 46 historias restantes hasta el 100%; no autoriza a dar por aprobado un sprint sin prueba manual y aprobación expresa del usuario.

## Plan de sprints

| Sprint | Objetivo                                                                                        | Historias nuevas                          | Acumulado | Avance al cierre |
| ------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------- | --------: | ---------------: |
| 01–06  | Fundaciones, accesos, clientes, vehículos, catálogo, inventario y servicios                     | HU-01 a HU-24, HU-58 a HU-62              |        29 |           31,52% |
| 07     | Ventas: borrador, líneas de producto/servicio, confirmación y consulta                          | HU-25 a HU-30                             |        35 |           38,04% |
| 08     | Citas: agenda, disponibilidad, búsqueda, reprogramación y cancelación                           | HU-31 a HU-35                             |        40 |           43,48% |
| 09     | Taller I: operación desde cita, diagnóstico, presupuesto, aprobación y técnico                  | HU-36, HU-42 a HU-46                      |        46 |           50,00% |
| 10     | Taller II: ejecución, consumo, estados, cierre, entrega e historial                             | HU-47 a HU-57                             |        57 |           61,96% |
| 11     | Cobros: pagos, saldo, pendientes, consulta e historial                                          | HU-37 a HU-41                             |        62 |           67,39% |
| 12     | Consulta operativa: resumen, filtros y acceso a detalles                                        | HU-63 a HU-65                             |        65 |           70,65% |
| 13     | BI: indicadores trazables para inventario, ventas, pagos, servicios y taller                    | HU-66 a HU-73                             |        73 |           79,35% |
| 14     | IA asistiva: elegibilidad, recomendaciones, versiones y permisos                                | HU-74 a HU-80                             |        80 |           86,96% |
| 15     | Calidad y rendimiento: validación, experiencia, compatibilidad y tiempos                        | HU-81, HU-82, HU-86, HU-89, HU-90         |        85 |           92,39% |
| 16     | Seguridad y preparación operativa: disponibilidad, sesiones, auditoría, respaldo y consistencia | HU-83 a HU-85, HU-87, HU-88, HU-91, HU-92 |        92 |          100,00% |

## Secuencia técnica

```text
clientes + vehículos + productos + inventario + servicios
                         ↓
                       ventas
                         ↓
                       citas
                         ↓
               operación de taller
                         ↓
                  ejecución y consumo
                         ↓
                       cobros
                         ↓
          consulta operativa → BI → IA
                         ↓
        calidad, seguridad y salida operativa
```

- **Sprint 07** depende del catálogo, existencias y servicios aprobados en Sprint 06. La salida de inventario debe ocurrir una sola vez y dentro de una transacción al confirmar una venta.
- **Sprint 08** reutiliza clientes y vehículos; la cita debe ser el punto de entrada al flujo del taller.
- **Sprints 09 y 10** requieren citas y separan el presupuesto de la ejecución para no descontar piezas ni cerrar una operación sin autorización.
- **Sprint 11** se apoya en ventas confirmadas y costos de servicio ya definidos. Los pagos confirmados no se reescriben: se registran como historial.
- **Sprints 12 a 14** son de lectura y análisis sobre datos operativos reales, no datos simulados.
- **Sprints 15 y 16** validan requisitos transversales sobre el sistema integrado y documentan evidencia reproducible de rendimiento, seguridad y recuperación.

## Puertas de control

Cada sprint se abre solo cuando el anterior tenga su acta de aprobación actualizada. Antes de iniciar uno nuevo se debe verificar:

1. Migraciones aplicadas en el entorno de prueba y semilla conocida, si corresponde.
2. Flujos manuales del sprint anterior aprobados, incluidos errores y permisos.
3. Pruebas automatizadas, typecheck, lint, build y formato en verde.
4. Sin cambios ajenos mezclados; archivos locales como `.playwright-mcp/` permanecen fuera del control de versiones.
5. Alcance congelado: un hallazgo del usuario se corrige en el sprint abierto antes de contar el avance.

## Criterios de prioridad

- No se construyen paneles BI ni recomendaciones IA sobre información incompleta, no confirmada o sin trazabilidad.
- Una operación que cambie existencias, saldos o estados críticos exige validación de servidor, permisos, transacción y auditoría.
- Las pantallas nuevas reutilizan los controles accesibles ya consolidados (búsqueda, selectores, estados vacíos, confirmaciones y mensajes de error).
- El Sprint 16 cierra el 100% funcional del backlog actual; cualquier característica nueva se registra como una historia posterior y no altera este cálculo sin aprobación.
