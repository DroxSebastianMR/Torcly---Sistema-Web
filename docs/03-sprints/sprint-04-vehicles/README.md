# Sprint 04 - Vehículos

Rama: `feature/sprint-04-vehicles`
Base: Sprint 03 aprobado
Historias: HU-11 a HU-14
Avance acumulado al aprobar: 14/92 = 15,22%

## Objetivo

Registrar vehículos únicos, vinculados a un cliente, y habilitar su consulta desde ambos dominios.

## Entregables

- alta con placa, marca, modelo, año y propietario existente;
- placa normalizada y única, año dentro del rango acordado;
- búsqueda por placa o cliente;
- detalle y actualización;
- navegación cliente ↔ vehículos;
- historial vacío o parcial explícito hasta operaciones;
- README de `vehicles` en frontend y API.

## Fuera de alcance

Operaciones e historial técnico completo.

## Implementación

### API

- Modelo Prisma `Vehicle` (`vehicles`): placa única normalizada, marca, modelo,
  año (1950..año actual + 1), `customerId` FK con `Restrict` y timestamps.
- Módulo `apps/api/src/modules/vehicles`: `GET/POST /api/v1/vehicles`,
  `GET/PUT /api/v1/vehicles/:id`, permisos `vehicles:read` / `vehicles:write`,
  paginación, filtro `customerId`, búsqueda por placa normalizada o
  propietario (nombre o documento).
- Placa canónica: mayúsculas sin espacios ni guiones; colisión de
  equivalentes → `409 VEHICLE_PLATE_DUPLICATE`. Cliente inexistente →
  `404 CUSTOMER_NOT_FOUND`; vehículo inexistente → `404 VEHICLE_NOT_FOUND`.
- Propietario inmutable: el esquema de actualización ignora `customerId` y el
  servicio nunca la modifica.
- Auditoría transaccional `VEHICLE_CREATED` / `VEHICLE_UPDATED` (actor, placa,
  `vehicleId`, `customerId`, requestId, IP) vía migración
  `20260926120000_add_vehicle_audit_events`; tabla en
  `20260926130000_add_vehicles`. No aplicadas a la BD de desarrollo.
- Seed: roles `vehicles:read` y `vehicles:write` agregados al Administrador.

### Frontend

- Feature `apps/web/src/features/vehicles/`: listado con resumen, búsqueda y
  paginación; ficha con datos, propietario e historial en blanco explícito;
  lienzo de registro/edición con selector de propietario (reutiliza
  `useCustomers`; bloqueado y no enviado al editar).
- Rutas `/vehiculos` y `/vehiculos/:id` protegidas con `vehicles:read`;
  navegación de retorno y cruzada Cliente ↔ Vehículo en ambas fichas.
- Sección "Vehículos del cliente" reutilizable en la ficha del cliente
  (visible solo con `vehicles:read`).

## Verificación

- API: typecheck, lint y `test` (49 passed, 20 skipped) en verde; CDN de
  pruebas de integración actívelo con `DATABASE_TESTS=true`.
- Web: typecheck, lint, `build` y 133 tests en verde (10 nuevos de vehículos
  y 1 de la sección en ficha de cliente).
- `pnpm format` y `format:check` en verde; `git diff --check` sin errores.
- Migraciones pendientes de aplicar y seed de autorizarse en la prueba manual:

```
pnpm --filter @torcly/api run db:migrate:deploy
pnpm --filter @torcly/api run db:seed
```
