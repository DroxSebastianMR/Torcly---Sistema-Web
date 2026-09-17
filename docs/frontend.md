# Torcly Web

Frontend modular de Torcly con React, Vite y TypeScript. Este repositorio contiene la base tÃ©cnica; las pantallas de negocio son placeholders, sin operaciones ni datos simulados.

## Inicio

Requiere Node.js 22.12+ y pnpm.

```sh
pnpm install
cp .env.example .env
pnpm dev
```

En PowerShell usa `Copy-Item .env.example .env`. La demostraciÃ³n permite explorar los mÃ³dulos sin backend y solo funciona en desarrollo con `VITE_ENABLE_DEMO=true`. La sesiÃ³n de demostraciÃ³n estÃ¡ en memoria y se pierde al recargar.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

## Arquitectura

- `src/app`: composiciÃ³n, configuraciÃ³n validada con Zod, proveedores y rutas.
- `src/features`: auth, dashboard, products, barcodes, inventory, purchases, sales, customers, cash, users, notifications, profile y reports.
- Cada dominio contiene `pages`, `components`, `hooks`, `services` y `types`. Crear `forms`, `utils` y `config` cuando se necesiten.
- `src/layouts`: estructuras autenticada y pÃºblica.
- `src/components/ui`: componentes compartidos compatibles con shadcn/ui; configuraciÃ³n en `components.json`.
- `src/infrastructure/api`: instancia Axios, cliente tipado y endpoints.
- `src/lib`: utilidades y permisos compartidos.
- `src/styles` y `src/assets`: estilos y recursos.

Las pÃ¡ginas llaman hooks del dominio; los hooks encapsulan TanStack Query y los servicios; los servicios usan el cliente API. Evitar Axios dentro de componentes y dependencias entre implementaciones internas de features. Las rutas de cada mÃ³dulo se cargan de forma diferida. Centralizar rutas en `paths.ts` y usar permisos explÃ­citos `modulo:read`.

Para incorporar un mÃ³dulo: crear sus carpetas, agregar su ruta a paths, registrarlo en permissions/navigation y protected.routes, definir contratos y servicios, y luego implementar hooks y pÃ¡ginas. Agregar permisos de escritura cuando se definan las operaciones.

## Contrato propuesto para NestJS

Base: `VITE_API_URL=http://localhost:3000/api/v1`. Contrato provisional pendiente de implementaciÃ³n y validaciÃ³n conjunta:

| MÃ©todo | Ruta                  | Entrada           | Respuesta  |
| -------- | --------------------- | ----------------- | ---------- |
| POST     | /auth/login           | email, password   | User       |
| GET      | /auth/me              | cookie de sesiÃ³n | User o 401 |
| POST     | /auth/logout          | cookie de sesiÃ³n | 204        |
| POST     | /auth/forgot-password | identifier        | 204        |
| POST     | /auth/reset-password  | password, token   | 204        |

`User`: `{ id, name, email, permissions: string[] }`. Las respuestas se esperan directas, sin envoltura `data`. El backend debe asignar una cookie HttpOnly al autenticar y eliminarla al salir. Configurar CORS con el origen concreto del frontend y credenciales; definir SameSite, Secure y protecciÃ³n CSRF segÃºn el despliegue. El frontend no almacena tokens. La cachÃ© se borra al cambiar o cerrar sesiÃ³n.

Los guards del frontend solo controlan la interfaz. NestJS deberÃ¡ validar autenticaciÃ³n y permisos en cada endpoint. La demostraciÃ³n no otorga acceso a la API.

Separar posteriormente el backend en su propio repositorio o carpeta de aplicaciÃ³n, con mÃ³dulos de negocio equivalentes. No se incluye cÃ³digo NestJS en esta base.

## Interfaz y despliegue

Tailwind con el plugin de Vite y componentes base Button/Input al estilo shadcn/ui. Agregar componentes segÃºn necesidad con `pnpm dlx shadcn@latest add dialog select skeleton`. Sonner maneja notificaciones.

Las variables VITE son pÃºblicas: nunca incluir secretos. El servidor que publique `dist` debe devolver `index.html` para rutas del frontend (fallback SPA), excluyendo la API.

GuÃ­as oficiales: [Vite](https://vite.dev/guide/) y [shadcn/ui para Vite](https://ui.shadcn.com/docs/installation/vite).

### RecuperaciÃ³n de acceso

`POST /auth/forgot-password` recibe `{ identifier }`: usuario, correo personal o correo empresarial. NestJS deberÃ¡ buscar la cuenta por cualquiera de esos datos y enviar el enlace al correo de recuperaciÃ³n verificado. Debe responder de forma uniforme con 204 exista o no la cuenta, limitar intentos y emitir tokens de un solo uso con vencimiento. Este contrato estÃ¡ pendiente de implementaciÃ³n en el backend. El frontend solo valida el formato; no comprueba la existencia de cuentas ni simula envÃ­os. Los usuarios no admiten espacios ni @ (reservado para correos).
