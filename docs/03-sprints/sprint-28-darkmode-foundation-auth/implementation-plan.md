# Plan de Implementación — Sprint 28

## 1\. Arquitectura del Proveedor de Tema (`@torcly/web`)

### Ubicación: `apps/web/src/features/theme/`

`types/theme.types.ts`:

`hooks/use-theme.ts`: Hook con acceso al contexto.

`context/theme-provider.tsx`:

*   Lee `localStorage.getItem('torcly-theme-preference')` inicial.
*   Agrega/remueve la clase `.dark` en `document.documentElement`.
*   Escucha eventos `change` en `window.matchMedia('(prefers-color-scheme: dark)')`.

Script anti-FOUC en `index.html`:

*   Pequeño script inline en `<head>` que ejecuta antes del primer paint:

---

## 2\. Variables CSS en `apps/web/src/styles/globals.css`

Definir bloque `.dark`:

```css
.dark {
  --background: 160 20% 6%; /* #0E1412 */
  --foreground: 155 15% 94%; /* #ECF2EF */
  --card: 160 18% 10%; /* #16201D */
  --card-foreground: 155 15% 94%;
  --popover: 160 18% 11%;
  --popover-foreground: 155 15% 94%;
  --primary: 154 74% 37%; /* #19A368 */
  --primary-foreground: 155 15% 98%;
  --secondary: 160 14% 15%;
  --secondary-foreground: 155 15% 90%;
  --muted: 160 14% 14%;
  --muted-foreground: 155 10% 60%;
  --accent: 160 18% 15%;
  --accent-foreground: 155 15% 94%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --border: 160 14% 18%; /* #243630 */
  --input: 160 14% 18%;
  --ring: 154 74% 37%;
}
```

---

## 3\. Adaptación de Pantallas y Componentes Auth

1.  `**apps/web/src/layouts/public/public-layout.tsx**`:
    *   Fondo adaptado `bg-background text-foreground transition-colors duration-200`.
    *   Ajuste de contenedor decorativo e isotipo de Torcly para alta legibilidad sobre fondos oscuros.
2.  `**apps/web/src/features/auth/forms/login-form.tsx**`:
    *   Tarjeta contenedora `bg-card border-border shadow-xs`.
    *   Campos de texto: `Input` con fondo oscuro, placeholder en `text-muted-foreground`, focus ring en `ring-primary`.
    *   Botón de submit con estado de carga `bg-primary hover:bg-primary/90 text-primary-foreground`.
    *   Selector rápido de tema flotante para permitir alternar tema desde la vista de login.
3.  `**apps/web/src/features/auth/forms/forgot-password-form.tsx**` **y** `**reset-password-form.tsx**`:
    *   Contraste de alertas, indicaciones y botones secundarios de retorno.

---

## 4\. Plan de Pruebas

*   Pruebas unitarias para `ThemeProvider`: verificación de lectura de `localStorage`, adición de clase `.dark` al root y toggle.
*   Pruebas de integración visual de formularios públicos para asegurar ausencia de texto oscuro sobre fondo oscuro (WCAG AA).

```html
<script>
  ;(function () {
    var pref = localStorage.getItem('torcly-theme-preference')
    var isDark =
      pref === 'dark' ||
      (!pref && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) document.documentElement.classList.add('dark')
  })()
</script>
```

```
export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}
```