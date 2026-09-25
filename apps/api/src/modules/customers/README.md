# Customers (API)

Catálogo centralizado de clientes: personas naturales (DNI) y jurídicas (RUC),
con validación y unicidad de documento en el servidor, búsqueda por documento,
nombre/razón social y teléfono, y auditoría de cada operación.

Trata datos personales: toda lectura o modificación exige autenticación y el
permiso adecuado (`customers:read` / `customers:write`). Sprint propietario: 03.

## Archivos principales

```
customers.routes.ts       montaje de rutas y permisos
customers.controller.ts   traducción HTTP (parseo zod + contexto de solicitud)
customers.service.ts      casos de uso, normalización por tipo y errores de negocio
customers.repository.ts   persistencia con Prisma, búsqueda y auditoría
customers.schemas.ts      contratos de entrada/salida validados con Zod
customers.types.ts        contratos locales del dominio
```

## Endpoints

| Método | Ruta                    | Permiso           | Descripción                                  |
| ------ | ----------------------- | ----------------- | -------------------------------------------- |
| GET    | `/api/v1/customers`     | `customers:read`  | Lista paginada con búsqueda y filtro de tipo |
| GET    | `/api/v1/customers/:id` | `customers:read`  | Detalle de un cliente                        |
| POST   | `/api/v1/customers`     | `customers:write` | Registra persona natural o jurídica          |
| PUT    | `/api/v1/customers/:id` | `customers:write` | Actualiza reaplicando todas las reglas       |

### Entrada (misma forma para crear y actualizar)

```jsonc
// Persona natural
{
  "type": "NATURAL",
  "documentNumber": "12345678",
  "firstName": "María",
  "lastName": "Pérez",
  "phone": "987654321",
  "email": "maria@torcly.local" // opcional
}

// Persona jurídica
{
  "type": "LEGAL",
  "documentNumber": "20123456789",
  "legalName": "Torcly Repuestos S.A.C.",
  "phone": "+51987654321",
  "email": null // opcional
}
```

## Validaciones

- DNI: exactamente 8 dígitos. RUC: exactamente 11 dígitos.
- El formulario de cada tipo exige solo sus campos: `firstName`/`lastName`
  para natural; `legalName` para jurídica.
- Teléfono: 6 a 15 dígitos, opcionalmente con prefijo `+`.
- Correo opcional validado con formato estándar.
- Unicidad de documento garantizada por índice único; al colisionar se devuelve
  `409 CUSTOMER_DOCUMENT_DUPLICATE` con mensaje accionable.
- La actualización vuelve a validar todo el payload y limpia los campos que no
  corresponden al tipo elegido.

## Búsqueda y filtros

| Parámetro           | Tipo   | Descripción                                                              |
| ------------------- | ------ | ------------------------------------------------------------------------ |
| `search`            | text   | Coincidencia (insensible) en documento, nombres, razón social o teléfono |
| `type`              | enum   | `all`, `NATURAL` o `LEGAL`                                               |
| `page` / `pageSize` | entero | Paginación (máx. `pageSize` 100)                                         |

## Auditoría

Cada creación/actualización registra un evento en `audit_logs` dentro de la
misma transacción:

- `CUSTOMER_CREATED` / `CUSTOMER_UPDATED`.
- `userId` = actor autenticado, `identifier` = documento del cliente y
  `metadata.customerId` = id del cliente.
- Se conservan `requestId` e `ipAddress` del contexto de la solicitud.

## Permisos y dependencias

- Depende del middleware de autorización `auth.middleware` (`requireAuth`,
  `requirePermission`) y de la infraestructura `prisma.service`.
- Se relaciona con `vehicles` e historial, que viven en sprints posteriores;
  este módulo no duplica su lógica.
