# Aceptación y pruebas - Sprint 01

## Criterios

- Una cuenta activa con credenciales válidas inicia sesión y recibe solo sus permisos.
- Credenciales inválidas o cuenta inactiva devuelven respuesta genérica sin filtrar existencia.
- Cinco fallos consecutivos bloquean la cuenta durante 15 minutos.
- Recargar conserva una sesión válida; 30 minutos de inactividad la invalidan.
- Logout invalida la sesión y una ruta protegida responde 401.
- Las contraseñas no se almacenan ni registran en texto legible.
- El frontend no guarda tokens en localStorage o sessionStorage.

## Evidencia

- pruebas API de login, `me`, logout, bloqueo, expiración y cuenta inactiva;
- pruebas frontend de validación, error y redirección;
- migración desde una base vacía y seed reproducible;
- ejecución satisfactoria de test, typecheck, lint y build.

## Prueba manual del usuario

Iniciar sesión, recargar, navegar, cerrar sesión, intentar volver con el historial y verificar un acceso denegado.
