# Criterios de Aceptación y Plan de Pruebas — Sprint 28

## 1. Criterios de Aceptación (DoD)

- [ ] **CA-01 (Infraestructura de tema):** Existe un proveedor de tema reactivo que permite seleccionar `light`, `dark` y `system`.
- [ ] **CA-02 (Anti-FOUC):** Al recargar la página en modo oscuro, no se aprecia destello blanco antes del renderizado de la UI.
- [ ] **CA-03 (Persistencia):** La preferencia de tema se almacena en `localStorage` y sobrevive a recargas y reinicios de sesión.
- [ ] **CA-04 (Login en Modo Oscuro):** El formulario de `/login` presenta contraste de texto superior a 4.5:1 (WCAG AA), bordes visibles y foco accesible.
- [ ] **CA-05 (Flujo de Contraseñas):** Las rutas `/recuperar-contrasena` y `/restablecer-contrasena` mantienen consistencia visual idéntica sin fugas de estilos claros.
- [ ] **CA-06 (No regresión):** Todos los tests existentes de autenticación y formularios pasan satisfactoriamente.

---

## 2. Casos de Prueba Manual

| ID           | Escenario                    | Paso a paso                                                                                      | Resultado Esperado                                                 |
| :----------- | :--------------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **TC-28-01** | Alternancia de tema en Login | 1. Ir a `/login`.<br>2. Clic en botón selector de tema.<br>3. Observar transición a modo oscuro. | El fondo cambia a verde carbón suave, inputs legibles, logo claro. |
| **TC-28-02** | Persistencia al recargar     | 1. Activar modo oscuro.<br>2. Presionar `Ctrl + F5` en el navegador.                             | La página recarga directamente en modo oscuro sin destello blanco. |
| **TC-28-03** | Autocompletado de navegador  | 1. En modo oscuro, usar autocompletado en usuario y contraseña.                                  | El fondo del autocompletado no se torna blanco brillante.          |
| **TC-28-04** | Validación de errores        | 1. Enviar formulario vacío.<br>2. Evaluar mensajes de validación.                                | Textos de error en rojo visible y legible sobre fondo oscuro.      |
