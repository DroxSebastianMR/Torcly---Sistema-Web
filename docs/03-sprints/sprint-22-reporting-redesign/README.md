# Sprint 22 - Rediseño de reportes y exportación

Rama objetivo: `feature/sprint-22-reporting-redesign`
Base técnica: Sprint 21 integrado.
Estado: **Listo para prueba del usuario.**

## Objetivo

Renovar el módulo de Reportes para convertir datos agregados y autorizados en visualizaciones claras, comparables y exportables. El rediseño conserva los filtros de período, las reglas de permisos y la trazabilidad de los módulos fuente.

## Alcance

- Base visual compartida de gráficos construida sobre Recharts, con colores y accesibilidad propios de Torcly.
- Tendencias de área para ventas y servicios.
- Barras comparativas para cobros, inventario y taller.
- Gráficos de composición para estados de cobro y órdenes, cuando el dato no es temporal.
- DTOs de tendencia enriquecidos: cobros bruto/compensado/neto, movimientos por tipo y órdenes creadas/entregadas.
- Exportación XLSX desde el servidor para los bloques autorizados, con hojas separadas y período aplicado.
- Botón de exportación visible solo a usuarios con `reports:read`.
- Estados de carga, vacío y error de los gráficos sin ocultar las tablas trazables existentes.
- Navegación tipo carrusel: una área de análisis por vez, con controles Anterior/Siguiente, para evitar una pantalla extensa y conservar el foco operativo.
- Tablas resumidas a los cinco elementos prioritarios; los tres primeros muestran rango visual. Los estados y desgloses breves permanecen completos.

## Decisiones de visualización

| Bloque     | Visual principal                               | Complemento                                          |
| ---------- | ---------------------------------------------- | ---------------------------------------------------- |
| Ventas     | Área: importe confirmado por período           | Barras horizontales: productos/servicios principales |
| Cobros     | Barras agrupadas: pagos, compensaciones y neto | Donut: obligaciones pendiente, parcial y pagada      |
| Inventario | Barras apiladas: entradas, salidas y ajustes   | Barras horizontales: stock actual frente al mínimo   |
| Servicios  | Área: facturación por período                  | Barras horizontales: servicios más vendidos          |
| Taller     | Barras agrupadas: órdenes creadas y entregadas | Donut: distribución de estados de órdenes y citas    |

No se usa un gráfico circular para tendencias temporales ni como sustituto de una tabla cuando se requiere precisión.

La UI conserva el encabezado y la tarjeta de acciones estándar de los demás módulos. El cambio se concentra en el área analítica: tarjetas de profundidad suave, gráficos y navegación secuencial entre áreas.

## Contrato de datos

Los contratos conservan `bucket`, `label`, `count` y `amount` para compatibilidad. Se añaden campos explícitos por bloque:

- Cobros: `grossCollected`, `compensated`, `netCollected` por período.
- Inventario: `initial`, `entry`, `exit`, `adjustmentIn` y `adjustmentOut` por período.
- Taller: `ordersCreated` y `delivered` por período.

Los importes, cantidades y agregados se calculan únicamente en servidor. Los clientes reciben datos mínimos, ya filtrados por permisos.

## Exportación

`GET /api/v1/reports/export?from=AAAA-MM-DD&to=AAAA-MM-DD` genera un libro XLSX en memoria. Incluye una hoja Resumen y una hoja por bloque al que el usuario tenga acceso. Cada hoja indica período, fecha de generación, métricas y tablas de detalle disponibles.

La exportación no introduce migraciones, no modifica datos operativos y respeta `reports:read` más las autorizaciones específicas de cada bloque.

## Fuera de alcance

- Tableros editables por usuario.
- Comparativas entre sucursales, presupuestos o metas.
- Exportación CSV/PDF, programación de envíos o almacenamiento de archivos.
- Datos sin permiso, identificación personal innecesaria o acceso directo del navegador a la base de datos.

## Criterio de cierre

Verificación realizada: API typecheck, lint y 417 pruebas aprobadas (111 de integración omitidas sin PostgreSQL); web typecheck, lint, build y suite completa en verde; `format:check` y `git diff --check` sin hallazgos. El acta queda en **Listo para prueba del usuario** hasta la validación manual y aprobación expresa.
