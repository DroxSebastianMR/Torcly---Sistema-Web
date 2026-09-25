# Aceptación y pruebas - Sprint 02.1

## Criterios de aceptación

- Cada estado del sistema (conexión, sesión vencida, permiso denegado, 404,
  error inesperado) es visible con título, descripción y acción de
  recuperación claras, y es anunciado como alerta (`role="alert"`).
- Al perder la conexión con la API, `ProtectedRoute` muestra una pantalla de
  recuperación en lugar de un bloque suelto, y «Reintentar» restaura la
  aplicación al volver el servicio.
- La ruta de error (`RouteError`) distingue 404 (salida al inicio) de errores
  internos (reintento + salida al inicio).
- `PermissionRoute` muestra acceso restringido sin el permiso y lleva al inicio.
- Los listados muestran estados de error con reintento y estados vacíos
  consistentes (usuarios y productos).
- Desactivar y reactivar un usuario usa un diálogo de confirmación accesible:
  variantes danger (ámbar) y success (esmeralda), foco inicial en la acción
  principal, trampa de foco, cierre con Escape y retorno de foco al abridor.
- Durante la confirmación no hay doble envío: acciones y cierre se bloquean
  (`pending`); si la acción falla, el diálogo permanece abierto e informa.
- Sin regresión en la lógica validada del Sprint 02 (auth, users, products).
- Test, typecheck, lint y build pasan.

## Plan de pruebas

### Automatizadas (`apps/web`)

- `feedback-from-error` — mapeo de errores sin respuesta (conexión), 401
  (sesión vencida), 403 (permiso), 404 (no encontrado) y resto (inesperado).
- `system-feedback-screen` — presets, sobreescrituras, acciones y estado
  `busy`.
- `error-state` / `empty-state` — contenido, acción, estado ocupado y alerta.
- `confirmation-dialog` — apertura, cancelar, confirmar (resolve/reject),
  bloqueo del doble envío, Escape con y sin `pending`, trampa de foco, retorno
  de foco y variantes visuales.
- Guards y router — `ProtectedRoute` (carga, redirección, errores de conexión
  e inesperados, sesión válida), `PermissionRoute` (con/sin permiso, sin
  sesión) y `RouteError` (404 vs 500 con `createMemoryRouter`).

### Manual (navegador)

1. Iniciar sesión con el administrador y llegar al dashboard.
2. En Usuarios, abrir «Desactivar Jose»: diálogo danger ámbar, foco en
   confirmar, cerrar con Escape.
3. Desactivar -> toast y fila «Inactivo»; «Activar» -> diálogo success
   esmeralda; confirmar y restaurar.
4. Navegar a una ruta inexistente: página 404 con «Volver al inicio».
5. Detener la API y recargar una ruta protegida: pantalla de recuperación con
   «Reintentar»; al volver la API y pulsar «Reintentar», carga el módulo.
6. Verificar el estado vacío real en Productos ("No se encontraron
   productos").
