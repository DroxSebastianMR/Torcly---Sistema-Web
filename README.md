# Torcly

Monorepo de gestión comercial con dos aplicaciones independientes:

- `apps/web`: React, Vite y TypeScript. Conserva la arquitectura por features.
- `apps/api`: Express 5 y TypeScript. Backend modular con API `/api/v1`.
- `docs`: fuentes, análisis, arquitectura, sprints y calidad.
- `output`: documentos entregables. `tmp`: archivos auxiliares locales.

## Desarrollo

Requisitos: Node.js 22.12+ y pnpm 11.19.0.

```sh
pnpm install
```

Copiar `.env.example` a `.env` en cada aplicación si no existen. Ya se prepararon los archivos locales para este entorno.

```sh
pnpm dev          # Inicia web y API; Ctrl+C detiene ambos
pnpm dev:web      # Solo frontend
pnpm dev:api      # Solo backend
pnpm demo         # Demo offline: solo web, datos locales y sin API/BD
```

Web: http://127.0.0.1:5173. API: http://127.0.0.1:3000/api/v1/health.
Vite reenvía `/api` al puerto 3000. En el navegador, `/api/v1/health` prueba la conexión a Express a través del frontend. Si se cambia el puerto API, actualizar también el proxy en `apps/web/vite.config.ts`.

Para presentar sin conexión, sigue la [guía de demo offline](docs/demo-offline.md).

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm start:api    # Ejecuta el backend compilado
```

## Base de datos

La API utiliza Prisma ORM y PostgreSQL en Supabase. `DATABASE_URL` apunta al
pool transaccional y se usa durante la ejecución de Express. `DIRECT_URL`
apunta al pool de sesión y queda reservado para Prisma CLI y migraciones.

```sh
pnpm db:generate        # Genera el cliente tipado
pnpm db:validate        # Valida schema y configuración
pnpm db:check           # Verifica ambos canales de conexión
pnpm db:smoke:products  # Verifica CRUD de productos y limpia los datos QA
pnpm db:migrate:dev     # Crea y aplica migraciones en desarrollo
pnpm db:migrate:deploy  # Aplica migraciones existentes en despliegues
pnpm db:studio          # Abre Prisma Studio
```

Las credenciales viven únicamente en `apps/api/.env`, excluido de Git. El
archivo `apps/api/.env.example` contiene las variables requeridas sin secretos.

## Estado actual

El backend implementa salud HTTP y de PostgreSQL, Prisma centralizado,
configuración validada, CORS, cabeceras de seguridad, identificadores de
solicitud, errores uniformes y cierre ordenado de servidor y base de datos. El
catálogo de productos ya incluye API, validaciones, categorías, marcas, unidades,
desactivación histórica y existencias derivadas de movimientos confirmados. La
autenticación, correo y demás operaciones comerciales se agregarán por módulos.

El modo demo offline se activa únicamente con `pnpm demo` (`VITE_DEMO_MODE=true`). No inicia Express ni Prisma y no realiza solicitudes HTTP: usa datos transitorios en memoria para presentar los Sprints 09 y 10. El modo habitual continúa utilizando autenticación y permisos de la API.

## Producción

Compilar ambas aplicaciones. Servir `apps/web/dist` con fallback SPA y ejecutar `apps/api/dist/server.js`. Configurar un proxy inverso para `/api` o una URL absoluta en `VITE_API_URL` al compilar el frontend. El proxy de Vite solo existe en desarrollo. La API admite HOST, PORT y CORS_ORIGINS; no incluir secretos en variables VITE.

## Organización

Ver el [índice documental](docs/README.md), la [arquitectura](docs/02-arquitectura/architecture.md) y la [referencia frontend](docs/02-arquitectura/frontend.md).
