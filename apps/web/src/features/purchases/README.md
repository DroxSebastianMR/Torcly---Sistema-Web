# Purchases (Web)

Módulo de compras y proveedores para el Sprint 17.

## Estructura

- `types/` — contratos TypeScript alineados con la API (`PurchaseSummary`, `PurchaseDetail`, `SupplierSummary`, etc.)
- `services/` — cliente HTTP con axios usando `api` y `endpoints.purchases`
- `hooks/` — React Query (`usePurchases`, `usePurchase`, `useSuppliers`, `useActiveSuppliers`, `usePurchaseMutations`)
- `forms/` — esquemas Zod para compras y proveedores (`purchaseFormSchema`, `supplierFormSchema`)
- `components/` — tabla con variantes desktop/mobile, barra de filtros, modal de detalle con confirmación y cancelación, formulario de borrador con selector de productos y cálculo en vivo, modales de proveedores y estado
- `pages/` — página principal con contadores, paginación y estados loading/empty/error/restricted
- `utils/` — formateadores de moneda, fecha y estado con badges semánticos

## Permisos

- `purchases:read` — listar compras y proveedores, filtrar y ver detalles
- `purchases:write` — registrar/editar proveedores, activar/desactivar proveedores, crear borradores, actualizar líneas, confirmar recepciones e invalidar/cancelar borradores

## Reglas de Interfaz

1. Formulario de compras permite agregar líneas con cantidades positivas hasta 3 decimales y costo unitario.
2. Compras recibidas son inmutables: no muestran botones de edición ni cancelación.
3. Confirmación de recepción solicita confirmación explícita mediante diálogo accesible antes de enviar la petición.
4. Total derivado y validado en servidor; el total del modal es informativo en tiempo real.

Sprint propietario: 17.
