# Sprint 28 — Modo Oscuro Parte 1: Fundamentos, Selector Global y Autenticación Pública

- **Rama base:** `feature/reponsive-ui`
- **Rama de trabajo:** `feature/darkmode-part-1-foundation-auth`
- **Estado:** Planificado (Documentación lista)
- **Alcance:** Exclusivo para la experiencia de usuarios y taller (no aplica a consola de plataforma `/plataforma`).

---

## 1. Contexto y Objetivos

Para ofrecer una experiencia de usuario moderna, ergonómica y amigable para el trabajo prolongado en taller (tanto en escritorios como en dispositivos móviles), se inicia la implementación del **Modo Oscuro Integral** para Torcly.

Este sprint sienta los **fundamentos arquitectónicos del sistema de temas** y adapta todas las pantallas públicas de acceso y seguridad:

1. Establecer la infraestructura de tema global (`light`, `dark`, `system`) mediante Tailwind CSS con estrategia basada en clase (`darkMode: 'class'`).
2. Diseñar la paleta semántica de modo oscuro en `globals.css` manteniendo la identidad de marca de Torcly (tonos verde bosque profundo, superficies carbonáceas elevadas y bordes sutiles que evitan el negro puro).
3. Implementar el proveedor de tema (`ThemeProvider`) y el hook reactivo `useTheme` con persistencia en `localStorage` y detección de preferencia del sistema operativo (`prefers-color-scheme`).
4. Adaptar al 100% las pantallas públicas de autenticación y sus componentes:
   - Login (`/login`)
   - Recuperación de contraseña (`/recuperar-contrasena`)
   - Restablecimiento de contraseña (`/restablecer-contrasena`)
   - Layout público (`public-layout.tsx`)
   - Controles de formulario compartidos: `Input`, `Button`, selectores, mensajes de validación y pantallas de error/feedback.

---

## 2. Paleta Semántica de Modo Oscuro (Identidad Torcly)

Para evitar el contraste excesivo del negro puro (`#000000`), Torcly utiliza una escala de carbón vegetal con tinte verde bosque profundo:

| Token Semántico        | Valor Modo Claro | Valor Modo Oscuro                  | Propósito                               |
| :--------------------- | :--------------- | :--------------------------------- | :-------------------------------------- |
| `--background`         | `#FFFFFF`        | `#0E1412` (Verde carbón base)      | Fondo general de la ventana y viewport  |
| `--surface` / `--card` | `#F8FAF9`        | `#16201D` (Superficie elevada)     | Tarjetas, contenedores, modales         |
| `--surface-elevated`   | `#FFFFFF`        | `#1D2A26` (Superficie secundaria)  | Popovers, dropdowns, inputs             |
| `--border`             | `#E2EAE6`        | `#243630` (Borde suavizado)        | Divisores, contornos de inputs y cards  |
| `--foreground`         | `#111816`        | `#ECF2EF` (Texto primario)         | Títulos, etiquetas principales          |
| `--muted-foreground`   | `#5C6F67`        | `#8EA49B` (Texto secundario)       | Descripciones, ayudas, timestamps       |
| `--primary`            | `#0E7448`        | `#19A368` (Acento verde esmeralda) | Botones primarios, enlaces, focus rings |
| `--destructive`        | `#DC2626`        | `#EF4444` (Rojo alarma)            | Estados de error, advertencias          |

---

## 3. Alcance Funcional — Sprint 28

### A. Sistema de Tema y Persistencia

- [ ] Configuración de Tailwind CSS con selector `dark` en `apps/web/src/styles/globals.css`.
- [ ] Creación de `ThemeContext` y `useTheme` en `apps/web/src/features/theme/`:
  - Soporte de valores: `'light' | 'dark' | 'system'`.
  - Escucha de cambios de `prefers-color-scheme` cuando el modo es `system`.
  - Persistencia segura en `localStorage` con clave `torcly-theme-preference`.
  - Script anti-parpadeo (anti-FOUC) en `index.html` para aplicar la clase `.dark` antes de la hidratación de React.

### B. Pantallas de Autenticación Pública

- [ ] **Login (`/login`):**
  - Formulario de inicio de sesión, logotipo adaptado para fondos oscuros, campos de usuario y contraseña con autofill styling oscuro, enlace de recuperación y botón de acceso.
- [ ] **Recuperación de Contraseña (`/recuperar-contrasena`):**
  - Formulario de solicitud de token, feedback informativo y estados de éxito.
- [ ] **Restablecimiento de Contraseña (`/restablecer-contrasena`):**
  - Validación de requisitos de seguridad de contraseña y confirmación visual.
- [ ] **Componentes Compartidos de Formulario:**
  - Adaptación de `Input`, `ClearInputButton`, mensajes de error de validación Zod y componente `Button` con variantes (`default`, `outline`, `ghost`).

---

## 4. Entregables del Sprint 28

1. **Infraestructura:** `apps/web/src/features/theme/` (`theme-context.tsx`, `use-theme.ts`, `theme-provider.tsx`).
2. **Estilos Globales:** `globals.css` actualizado con variables CSS para `.dark`.
3. **Páginas Auth:** `/login`, `/recuperar-contrasena` y `/restablecer-contrasena` adaptadas y verificadas.
4. **Pruebas:** Pruebas unitarias para `useTheme` y pruebas de regresión para formularios de auth.
