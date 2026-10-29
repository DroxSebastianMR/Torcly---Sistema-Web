# Arquitectura de Torcly

Un repositorio Git, dos aplicaciones y un lockfile de pnpm. Cada aplicación declara sus dependencias y entorno. La raíz coordina comandos, sin código de negocio.

## Frontend

`apps/web/src` contiene app, features, layouts, components, infrastructure, lib, styles y assets. Las páginas componen vistas, los hooks coordinan estado y los servicios llaman a la API. Ningún componente importa código del servidor.

## API

```text
apps/api/src/
  app.ts                    Composición HTTP, sin escuchar un puerto
  server.ts                 Inicio y apagado del proceso
  routes.ts                 Registro de módulos bajo /api/v1
  config/env.ts             Lectura y validación del entorno
  modules/<dominio>/        routes, controller, service, schema, types
  middlewares/              Errores y contexto de solicitudes
  infrastructure/database/  Prisma, pool PostgreSQL y transacciones
  infrastructure/mail/      Adaptador de correo (pendiente)
  shared/errors/            Errores de aplicación
```

Flujo: ruta → validación → controlador → servicio → repository → Prisma. Los controladores resuelven HTTP, los servicios contienen reglas de negocio y los repositorios concentran las consultas. La infraestructura no depende de las vistas.

## Persistencia y seguridad

La API utiliza PostgreSQL con Prisma. El backend es la única capa que accede a la base y las credenciales nunca se exponen mediante variables `VITE_*`.

La autenticación prevista usa cookie de sesión HttpOnly. Los permisos se validan en servidor y se reflejan en la interfaz. Contraseñas, intentos fallidos, expiración, auditoría y transacciones se implementan conforme al SRS.

## Productos

El módulo `modules/products` implementa catálogo, categorías, marcas y unidades. El código y el código de barras son únicos; los productos se desactivan sin eliminar su historial. La existencia se deriva exclusivamente de movimientos de inventario confirmados y nunca se modifica desde el catálogo.

Endpoints principales:

- `GET /api/v1/products`: búsqueda, filtros y paginación.
- `POST /api/v1/products`: registro validado.
- `PUT /api/v1/products/:id`: actualización del catálogo.
- `PATCH /api/v1/products/:id/status`: activación o desactivación.
- `GET /api/v1/products/options`: categorías, marcas y unidades activas.
- `POST /api/v1/products/categories|brands|units`: datos maestros.

## Contratos iniciales

`GET /api/v1/health` devuelve `{ status, service, timestamp }`. `GET /api/v1/health/database` comprueba la disponibilidad de PostgreSQL.

Los errores usan `{ error: { code, message, requestId } }`. La cabecera `X-Request-Id` permite correlacionar la respuesta. No se devuelven trazas internas.

Autenticación prevista: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/forgot-password` con `{ identifier }` y `POST /auth/reset-password`. Son contratos pendientes. El servidor validará permisos independientemente de los guards del frontend.

## Módulos

El detalle de carpetas, responsabilidades y reutilización está en [module-standard.md](module-standard.md). Cada módulo trabajado debe incluir su README y explicar sus relaciones con otros dominios.

## Pruebas

Vitest se utiliza en ambas aplicaciones. Supertest prueba Express sin depender de un servidor externo. Las pruebas de persistencia que necesiten PostgreSQL deben usar un entorno controlado y datos descartables.

No se agregan microservicios, colas ni paquetes compartidos sin una necesidad concreta.

Referencias: https://expressjs.com/en/guide/error-handling/ y https://vite.dev/config/server-options#server-proxy.
