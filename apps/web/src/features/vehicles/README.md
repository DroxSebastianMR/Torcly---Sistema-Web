# Vehicles (web)

Listado, búsqueda, registro, ficha y actualización de vehículos vinculados de
forma obligatoria a clientes. La placa se normaliza en mayúsculas sin espacios
ni guiones y es única; el propietario se muestra y navega hacia su ficha, pero
**no se puede cambiar** al editar. Sprint propietario: 04.

## Archivos principales

```
pages/vehicles-page.tsx          listado con resumen, búsqueda y paginación
pages/vehicle-detail-page.tsx    ficha con datos, propietario e historial técnico
components/vehicles-toolbar.tsx  búsqueda por placa, propietario o documento
components/vehicles-table.tsx    tabla de escritorio y tarjetas móviles
components/vehicle-form-modal.tsx form crea/edita con selector de propietario
components/customer-vehicles.tsx sección de vehículos reutilizada en la ficha de cliente
hooks/use-vehicles.ts            consultas (listado, detalle, por cliente) y mutaciones
hooks/use-vehicle-owner-options.ts selector de propietario conectado a clientes reales
services/vehicles.service.ts     llamadas a la API /vehicles
forms/vehicles.schema.ts         validación del formulario con Zod
types/vehicles.types.ts          contratos locales
utils/vehicle-formatters.ts      normalización de placa y formatos
```

## Reglas de negocio implementadas

- **Placa canónica**: se normaliza (mayúsculas, sin espacios ni guiones) y se
  valida con `/^[A-Z0-9]{5,8}$/` (1950..año actual + 1). El backend garantiza
  unicidad; las colisiones muestran el mensaje de la API.
- **Propietario obligatorio**: selector reutilizable conectado a `customers`
  (carga los primeros 100 clientes; con más de 10 opciones el `SmartSelect`
  activa la búsqueda). En edición queda **deshabilitado** y no se envía al
  actualizar.
- **Historial técnico**: se muestra como estado explícito "en blanco" y no se
  fabrica información.
- **Permisos**: `vehicles:read` para listado, detalle y ficha de cliente;
  `vehicles:write` para registrar y editar.

## Navegación

- `/vehiculos` (listado) y `/vehiculos/:id` (ficha), protegidas con
  `vehicles:read` en `protected.routes.tsx`.
- En la ficha del cliente (`/clientes/:id`) la sección "Vehículos del cliente"
  lista las unidades reales y enlaza a su ficha; se muestra solo si el usuario
  tiene `vehicles:read`. La ficha del vehículo enlaza al propietario.

## Dependencias

- `customers` (tipos, selector de opciones, formatos `customerDisplayName`,
  `dateFormatter`, `documentLabel`), `auth` (permisos) e infraestructura `api`
  (`endpoints`).
- No duplica componentes: reutiliza `Modal`, `SmartSelect`, `EmptyState`,
  `ErrorState`, `Button` e `Input` compartidos.
