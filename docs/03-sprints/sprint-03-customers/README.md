# Sprint 03 - Clientes

Rama: `feature/sprint-03-customers`
Base: Sprint 02 aprobado
Historias: HU-07 a HU-10
Avance acumulado al aprobar: 10/92 = 10,87%

## Objetivo

Centralizar personas naturales y jurídicas con búsqueda, actualización y relaciones navegables.

## Entregables

- registro con tipo, DNI/RUC, nombre o razón social y teléfono;
- unicidad y validación de documento/teléfono en servidor;
- búsqueda por documento, nombre/razón social y teléfono;
- detalle y actualización;
- secciones preparadas para vehículos e historial, sin inventar datos;
- permisos y auditoría de acceso a datos personales;
- README de `customers` en frontend y API.

## Alcance implementado (API)

- `CustomerType` (`NATURAL`/`LEGAL`) y modelo `Customer` con documento único
  (índices por tipo, apellidos, razón social y teléfono).
- Endpoints: `GET /api/v1/customers`, `GET /api/v1/customers/:id`,
  `POST /api/v1/customers`, `PUT /api/v1/customers/:id`.
- Búsqueda insensible con OR sobre documento, nombres, razón social y
  teléfono; filtro `type` y paginación.
- Errores: `400 VALIDATION_ERROR`, `404 CUSTOMER_NOT_FOUND`,
  `409 CUSTOMER_DOCUMENT_DUPLICATE`, `403 AUTH_FORBIDDEN`.
- Auditoría transaccional: `CUSTOMER_CREATED`/`CUSTOMER_UPDATED` con actor,
  documento (`identifier`) y `metadata.customerId`.
- Permisos: `customers:read` (consulta) y `customers:write` (modificación),
  ambos en `apps/api/prisma/seed.ts`.

## Alcance implementado (Web)

- Listado con búsqueda real, filtro de tipo, paginación y estadísticas.
- Documento numérico con coincidencia exacta; nombre, razón social y teléfono
  con coincidencia parcial. Las sugerencias siguen la misma regla para evitar
  que un RUC que contenga un DNI muestre un cliente equivocado.
- Formulario único que adapta campos por tipo (DNI + nombres/apellidos o RUC +
  razón social), con correo opcional; el tipo se bloquea al editar.
- Ficha con datos de contacto, edición y secciones Vehículos/Historial vacías
  preparadas con `EmptyState`.
- Estados cubiertos: carga, error, vacío, éxito y permisos.
- Los selectores se muestran mediante portal sobre tablas y modales, sin
  recortarse por contenedores; el desplazamiento interno de los modales se
  conserva sin una barra visual.

## Fuera de alcance

El historial solo mostrará relaciones disponibles; vehículos y operaciones se completan en sprints posteriores.

## Decisión de acceso vigente

La operación inicial tendrá únicamente el rol **Administrador**. Las dos
personas que administran la tienda contarán con una cuenta propia y ese mismo
rol; no se crearán perfiles adicionales ni una matriz de permisos hasta que el
negocio lo solicite expresamente.
