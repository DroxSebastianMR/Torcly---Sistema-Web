# Cash sessions (API)

Sesiones manuales de caja para apertura, arqueo y cierre. Una sola sesión puede estar abierta; los pagos y compensaciones nuevos se vinculan a ella. El efectivo esperado se calcula en servidor y los cierres permanecen inmutables.

- Rutas: `/api/v1/cash-sessions/current`, apertura, cierre, detalle e historial.
- Permisos: lectura `cash:read`; apertura/cierre `cash:write`.
- Los pagos históricos sin `cashSessionId` se conservan como registros anteriores al control de caja.
- Cierre: `efectivo esperado = apertura + pagos CASH - compensaciones CASH`.

Sprint propietario: 21.
