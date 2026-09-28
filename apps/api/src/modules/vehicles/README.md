# Vehicles (API)

Registro, consulta y actualización de vehículos vinculados de forma obligatoria
a un cliente existente. La placa se normaliza a su forma canónica y es única;
el propietario se resuelve en la misma respuesta sin exponer datos fuera de
permisos. El propietario **no se puede cambiar** al editar un vehículo.

Depende de `customers` (existencia del propietario) y de la auditoría. Sprint
propietario: 04.

## Archivos principales

```
vehicles.routes.ts       montaje de rutas y permisos
vehicles.controller.ts   traducción HTTP (parseo zod + contexto de solicitud)
vehicles.service.ts      casos de uso, normalización de placa y errores de negocio
vehicles.repository.ts   persistencia con Prisma, búsqueda por placa/propietario y auditoría
vehicles.schemas.ts      contratos de entrada/salida validados con Zod
vehicles.types.ts        contratos locales del dominio
vehicles.utils.ts        normalización de placa y rango de años
```

## Endpoints

| Método | Ruta                   | Permiso          | Descripción                                            |
| ------ | ---------------------- | ---------------- | ------------------------------------------------------ |
| GET    | `/api/v1/vehicles`     | `vehicles:read`  | Lista paginada con búsqueda y filtro por cliente       |
| GET    | `/api/v1/vehicles/:id` | `vehicles:read`  | Detalle de un vehículo                                 |
| POST   | `/api/v1/vehicles`     | `vehicles:write` | Registra un vehículo de un cliente existente           |
| PUT    | `/api/v1/vehicles/:id` | `vehicles:write` | Actualiza marca, modelo, año y placa (sin propietario) |

### Entrada

```jsonc
// Crear
{
  "plate": "ABC-123",          // se normaliza a "ABC123"
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2021,
  "customerId": "2b8a4c19-…"   // pertenece a un cliente existente
}

// Actualizar (sin customerId: el propietario es inmutable)
{
  "plate": "ABC123",
  "brand": "Hyundai",
  "model": "Tucson",
  "year": 2023
}
```

### Respuesta del detalle

```jsonc
{
  "id": "…",
  "plate": "ABC123",
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2021,
  "customerId": "…",
  "owner": {
    "id": "…",
    "type": "NATURAL",
    "documentNumber": "12345678",
    "firstName": "María",
    "lastName": "Pérez",
    "legalName": null,
  },
  "createdAt": "…",
  "updatedAt": "…",
}
```

## Normalización de placa (decisión documentada)

- La placa se guarda siempre en forma canónica: **mayúsculas, sin espacios ni
  guiones** (se eliminan `" "` y `"-"`). Escribir `abc-123`, `abc 123` o
  `ABC123` produce el mismo valor `ABC123`.
- Patrón canónico: `/^[A-Z0-9]{5,8}$/` (plenas peruanas típicas: `ABC-123`,
  `A1B-234`, motos `AB-1234`). La entrada tolera separadores; el resultado
  canónico se valida contra el patrón.
- Unicidad con índice único sobre la columna `plate`; las escrituras
  equivalentes colisionan y devuelven `409 VEHICLE_PLATE_DUPLICATE`.

## Validaciones

- `plate`: requerida, entre 5 y 12 caracteres de entrada, normalizada y con el
  patrón canónico.
- `brand` / `model`: obligatorios (máx. 80 / 120 caracteres).
- `year`: entero entre `VEHICLE_YEAR_MIN` (1950) y `VEHICLE_YEAR_MAX`
  (año actual + 1); ambos extremos válidos.
- `customerId`: UUID de un cliente existente; si no existe → `404
CUSTOMER_NOT_FOUND`.
- En la actualización el cliente **no se acepta**: el esquema descarta
  `customerId` y el servicio nunca toca `customerId`.

## Búsqueda y filtros

| Parámetro         | Tipo   | Descripción                                                  |
| ----------------- | ------ | ------------------------------------------------------------ |
| `search`          | text   | Coincidencia insensible en placa (normalizada) o propietario |
| `customerId`      | uuid   | Filtra los vehículos de un cliente (ficha del cliente)       |
| `page`/`pageSize` | entero | Paginación (máx. `pageSize` 100)                             |

## Auditoría

Cada creación/actualización registra un evento en `audit_logs` dentro de la
misma transacción:

- `VEHICLE_CREATED` / `VEHICLE_UPDATED`.
- `userId` = actor autenticado, `identifier` = placa canónica del vehículo.
- `metadata.vehicleId` y `metadata.customerId` en el evento.
- Se conservan `requestId` e `ipAddress` del contexto de la solicitud.

## Permisos y dependencias

- Exige autenticación (`requireAuth`) y `vehicles:read` / `vehicles:write`
  según la operación. Solo existe el rol Administrador; el seed le asigna
  ambos permisos (no se crean roles nuevos).
- Depende de `customers` y de `prisma.service`. El historial técnico, ventas,
  servicios y transferencias de propiedad quedan fuera del alcance de este
  sprint y **no se fabrican**.
