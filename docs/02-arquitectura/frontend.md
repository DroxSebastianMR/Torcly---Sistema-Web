# Torcly Web

Frontend modular con React, Vite y TypeScript. La base técnica está operativa; las pantallas de negocio siguen siendo placeholders hasta su sprint.

## Inicio

Requiere Node.js 22.12+ y pnpm 11.19+.

```sh
pnpm install
pnpm dev:web
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

La demostración solo funciona en desarrollo con `VITE_ENABLE_DEMO=true`. Mantiene una sesión en memoria y no concede acceso a la API.

## Arquitectura

- `src/app`: composición, entorno, proveedores y rutas.
- `src/features`: dominios funcionales.
- `src/layouts`: estructuras públicas y autenticadas.
- `src/components`: UI compartida.
- `src/infrastructure/api`: Axios, cliente y endpoints.
- `src/lib`: utilidades transversales y permisos.
- `src/styles` y `src/assets`: estilos y recursos globales.

Las páginas componen vistas; los hooks coordinan formularios y TanStack Query; los servicios llaman a la API. No se importa código de `apps/api` ni se usa Axios dentro de componentes. Véase [estándar de módulos](module-standard.md).

## Contrato de autenticación

Base por defecto: `/api/v1`.

| Método | Ruta                    | Entrada                  | Respuesta           |
| ------ | ----------------------- | ------------------------ | ------------------- |
| POST   | `/auth/login`           | `identifier`, `password` | usuario autenticado |
| GET    | `/auth/me`              | cookie de sesión         | usuario o 401       |
| POST   | `/auth/logout`          | cookie de sesión         | 204                 |
| POST   | `/auth/forgot-password` | `identifier`             | 204 uniforme        |
| POST   | `/auth/reset-password`  | `password`, `token`      | 204                 |

La API Express asignará una cookie HttpOnly y validará autenticación y permisos. El frontend no almacena tokens. Los guards solo controlan la interfaz.

## Diseño

Se conserva la identidad actual: verde bosque, acento verde, superficies claras, sidebar, header y componentes compatibles con shadcn/ui. Cada pantalla debe cubrir carga, vacío, error y éxito, funcionar en laptop/tablet y no depender solo del color para comunicar estado.
