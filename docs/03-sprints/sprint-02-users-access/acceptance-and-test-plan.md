# Aceptación y pruebas - Sprint 02

- Solo un administrador autorizado accede al módulo.
- No se permite identificador duplicado ni rol inexistente.
- Crear, buscar, consultar y actualizar funciona con persistencia real.
- Desactivar impide un nuevo login y no elimina operaciones previas.
- Reactivar restituye el acceso según permisos.
- Toda acción no autorizada devuelve 403 aunque se invoque la API directamente.
- Estados vacío, carga, error y éxito son visibles y accesibles.
- Test, typecheck, lint y build pasan.

Prueba manual: crear usuario, buscarlo, cambiar rol, desactivarlo, comprobar login rechazado y reactivarlo.
