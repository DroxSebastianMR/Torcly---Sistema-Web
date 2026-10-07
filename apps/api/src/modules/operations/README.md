# Operations (API)

Módulo de consulta operativa de **solo lectura**: compone un resumen trazable y listas de atención desde las fuentes existentes (citas, órdenes de taller, ventas, pagos e inventario) sin crear ni modificar ningún registro.

- Es un módulo de lectura: no crea, edita, confirma, cobra, entrega ni altera existencias, saldos o estados. Solo expone `GET /api/v1/operations/*`.
- Cada sección declara su fuente, su campo de período, su criterio de inclusión y sus permisos en `descriptors`, de modo que la UI nunca tenga que adivinar de dónde sale un número.
- Las secciones con campo de período `date`, `createdAt` o `confirmedAt` respetan el rango `from`/`to` (formato `AAAA-MM-DD`, límites UTC `00:00:00.000Z` y `23:59:59.999Z`). Las secciones con `snapshot` (`payments` e `inventory`) son instantáneas actuales y no se ven alteradas por el período.
- Los montos financieros se calculan en servidor con las mismas reglas de Caja: `computePaidAmount`, `computeBalance` y `collectionStatusFromBalance` de `payments`. El cliente nunca recalcula saldos.
- El filtro de período válido se aplica en servidor; un rango invertido responde `400 OPERATIONS_DATE_RANGE_INVALID` y una sección desconocida `400 VALIDATION_ERROR`.
- Los permisos se verifican en servidor en dos niveles: `dashboard:read` abre las rutas y cada sección exige los permisos de lectura de su fuente. Sin permiso no hay datos: `403 OPERATIONS_SECTION_FORBIDDEN` en la lista de atención y la sección simplemente no aparece en el resumen. Un faltante de permisos nunca se representa como cero.
- Cada lista de atención se pagina en servidor (`page`, `pageSize`) y devuelve solo referencias legibles (código, cliente, vehículo); nunca expone UUID internos ni calcula reglas de negocio de los módulos fuente.
- Estados de cobro derivados (`PENDING`, `PARTIALLY_PAID`, `PAID`) y stock bajo se derivan de los mismos criterios que `payments` y `inventory`, sin duplicar reglas.

Endpoints:

- `GET /api/v1/operations/summary?from=&to=` → `{ generatedAt, period, sections, descriptors }`
- `GET /api/v1/operations/attention/:section?from=&to=&page=&pageSize=` → `{ section, descriptor, period, data, pagination }` con `:section` en `appointments | workOrders | sales | payments | inventory`.

Sprint propietario: 12.
