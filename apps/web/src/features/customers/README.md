# Customers (web)

Registro, búsqueda, detalle y actualización de clientes naturales o jurídicos.
El formulario cambia los campos según el tipo (DNI + nombres/apellidos o RUC +
razón social) y la ficha muestra las secciones de vehículos e historial solo
cuando existan registros (hoy vacías, preparadas para sprints posteriores).

## Estructura

```
components/customers-toolbar.tsx      búsqueda (SmartSelect forceSearch) y filtro de tipo
components/customers-table.tsx        tabla escritorio + tarjetas móvil + EmptyState + skeleton
components/customer-form-modal.tsx    formulario create/edit según tipo, validación Zod + RHF
forms/customers.schema.ts             contrato de formulario (documento/teléfono/correo)
hooks/use-customers.ts                queryKeys + useCustomers/useCustomer/mutations
pages/customers-page.tsx              listado con búsqueda, filtro, paginación y stats
pages/customer-detail-page.tsx        ficha con datos y secciones Vehículos/Historial
services/customers.service.ts         llamadas a la API con query string
types/customers.types.ts              contratos de la feature
utils/customer-formatters.ts          nombres, iniciales, fechas y mapeos de payload
```

## Reglas

- Búsqueda en servidor (documento, nombres, razón social, teléfono); el
  SmartSelect de búsqueda usa `forceSearch` + `allowCustomValue`; el tipo usa
  un SmartSelect de opción cerrada. No se usan `<select>` nativos.
- `Registrar cliente` y edición exigen `customers:write`; listado y ficha
  `customers:read`. El permiso se evalúa en cada página.
- El tipo no se cambia al editar (el documento identifica la ficha).
- La ficha renderiza `EmptyState` en Vehículos e Historial para comunicar que
  se poblarán con sprints futuros.
- Estados cubiertos: carga, error con reintento, vacío, éxito con toast.

Depende de auth/permisos y de la API `customers` (`/api/v1/customers`).
Se relaciona con vehicles, citas, ventas y taller (sprints posteriores).
Sprint propietario: 03.
