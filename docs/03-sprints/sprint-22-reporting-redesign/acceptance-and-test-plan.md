# Plan de aceptación y pruebas - Sprint 22

## Preparación

1. Iniciar sesión con `reports:read` y permisos de al menos dos módulos fuente.
2. Contar con ventas confirmadas, pagos, movimientos y una orden de taller en el período de prueba.
3. Seleccionar un rango de siete a treinta días.

## Casos funcionales

| ID     | Acción                                    | Resultado esperado                                                                                                               |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| S22-01 | Abrir Reportes.                           | Solo se muestran bloques autorizados y cada gráfico refleja el período por defecto.                                              |
| S22-02 | Cambiar el rango de fechas.               | Las tarjetas, gráficos y tablas se recalculan para el mismo rango, sin mezclar períodos.                                         |
| S22-03 | Revisar Ventas y Servicios.               | La tendencia de área muestra importe; el ranking conserva nombre, código, cantidad e importe.                                    |
| S22-04 | Revisar Cobros.                           | Pagos, compensaciones y neto se distinguen; los estados pendientes/parciales/pagados no se confunden con una tendencia.          |
| S22-05 | Revisar Inventario.                       | Entradas, salidas y ajustes se distinguen; el stock bajo conserva stock y mínimo.                                                |
| S22-06 | Revisar Taller.                           | Órdenes creadas y entregadas se distinguen; la distribución de estados es legible.                                               |
| S22-07 | Exportar Excel.                           | Descarga un XLSX con Resumen y solamente las hojas de bloques autorizados, período y fecha de generación.                        |
| S22-08 | Abrir el XLSX descargado.                 | Las cantidades e importes son numéricos, los encabezados son legibles y no hay identificadores internos ni datos no autorizados. |
| S22-09 | Probar un usuario con permisos limitados. | No ve, consulta ni exporta bloques sin autorización.                                                                             |
| S22-10 | Consultar un período sin actividad.       | Los gráficos y tablas muestran estado vacío comprensible; no fallan ni inventan datos.                                           |

## Cobertura automatizada mínima

- DTOs enriquecidos de cobros, inventario y taller.
- Permisos del endpoint de exportación y contenido limitado a bloques autorizados.
- Libro XLSX válido con hoja Resumen.
- Servicio web de descarga y acción accesible de exportación.
- Estados loading, vacío y error de los gráficos.

## Resultado de verificación técnica

- API: typecheck, lint y 417 pruebas aprobadas; 111 pruebas de integración permanecen omitidas sin PostgreSQL de prueba.
- Web: typecheck, lint, build y suite completa aprobados.
- Formato y consistencia: `pnpm format:check` y `git diff --check` aprobados.
