# Auth (web)

Implementa acceso por usuario o correo, recuperación y restablecimiento. `pages` compone rutas; `forms` contiene esquemas, pruebas y vistas; `hooks` coordina navegación y estado; `services` consume `/auth`; `types` define el usuario y las entradas.

`AuthProvider` restaura la sesión con `/auth/me`, conserva la caché de autenticación al iniciar y limpia las consultas de negocio al cambiar de sesión. Los guards controlan rutas públicas, protegidas y permisos visuales.

Mientras se resuelve la sesión, ambos guards reutilizan `components/ui/loading-screen.tsx`, una pantalla accesible y personalizable que mantiene la identidad visual de Torcly.

No existe acceso demo ni se almacenan tokens en `localStorage` o `sessionStorage`; el navegador utiliza exclusivamente la cookie HttpOnly emitida por la API. Se relaciona con la navegación y todos los módulos protegidos. Sprint propietario: 01.
