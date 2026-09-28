# Aceptación y pruebas - Sprint 04

- No se crea un vehículo con placa inválida/duplicada o cliente inexistente.
- La normalización evita duplicados por mayúsculas, espacios o guiones equivalentes.
- La búsqueda por placa y propietario funciona.
- La ficha permite editar datos válidos sin cambiar relaciones de forma accidental.
- Cliente y vehículo se enlazan correctamente en ambas vistas.
- Permisos, auditoría y estados de interfaz funcionan.
- Test, typecheck, lint y build pasan.

## Automatizado

- API: esquemas (placa canónica, rango de años, `customerId` ignorado en
  actualización) y servicio con mocks (`vehicles.schemas.test.ts`,
  `vehicles.service.test.ts`); integración real opcional
  (`vehicles.integration.test.ts`, `DATABASE_TESTS=true`):
  permisos 403, placa duplicada 409, cliente inexistente 404, búsquedas,
  actualización sin cambio de propietario y auditoría (3 eventos).
- Web: `vehicle-form-modal.test.tsx` (validación, normalización de placa,
  payload correcto, propietario bloqueado en edición y año fuera de rango),
  `vehicles-page.test.tsx` (estados, permisos, navegación a ficha y
  propietario, búsqueda), `vehicle-detail-page.test.tsx` (ficha, enlaces,
  permisos, error), `customer-vehicles.test.tsx` (estados y navegación) y
  adaptación de `customer-detail-page.test.tsx`.

## Prueba manual

1. Aplicar migraciones y seed (`db:migrate:deploy`, `db:seed`).
2. Ingresar con un usuario con `vehicles:read` / `vehicles:write`.
3. Crear un vehículo con placa separada (p. ej. `abc-123`) y propietario
   existente; verificar que la placa se guarda como `ABC123`.
4. Intentar registrar la misma placa con otro formato → rechazo `409`.
5. Agregar duplicados deliberados (`ABC-123`, `abc123`) y validar la unicidad.
6. Buscar por placa incompleta, por nombre de propietario y por documento.
7. Editar la ficha; confirmar que el propietario queda deshabilitado y el
   cambio no altera la relación.
8. Abrir el vehículo desde la ficha del cliente y navegar de vuelta al
   propietario desde la ficha del vehículo.
9. Probar sin permiso de escritura (botones ocultos) y con solo lectura.
