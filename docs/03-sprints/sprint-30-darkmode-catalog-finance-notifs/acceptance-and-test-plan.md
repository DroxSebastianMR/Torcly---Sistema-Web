# Criterios de Aceptación y Plan de Pruebas — Sprint 30

## 1. Criterios de Aceptación (DoD)

- [ ] **CA-01 (Módulos de Almacén):** Productos, Inventario y Reabastecimiento son completamente operables en modo oscuro.
- [ ] **CA-02 (Módulos Financieros):** Las vistas de Ventas y Caja muestran importes, arqueos y cobros mixtos con contraste y legibilidad óptima.
- [ ] **CA-03 (Bandejas de Avisos):** Notificaciones y Novedades presentan la paleta identitaria de 5 colores con fondos atenuados y textos contrastados en modo oscuro.
- [ ] **CA-04 (Gráficos Analíticos):** Los gráficos de Reportes adaptan sus ejes, grillas y tooltips sin elementos claros o fondos desalineados.
- [ ] **CA-05 (Configuración de Perfil):** El módulo de perfil incluye un selector visual de tema con tres opciones (`Claro`, `Oscuro`, `Sistema`).
- [ ] **CA-06 (Aislamiento de Plataforma):** La consola administrativa `/plataforma` permanece excluida del alcance sin afectación colateral.
- [ ] **CA-07 (Calidad Integral):** Cero errores de typecheck en `@torcly/web` y suite de pruebas unitarias pasando al 100%.

---

## 2. Casos de Prueba Manual

| ID           | Pantalla       | Acción                                              | Resultado Esperado                                                                 |
| :----------- | :------------- | :-------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **TC-30-01** | Inventario     | Consultar kardex y abrir modal de ajuste.           | Filas de movimientos legibles, badges de tipo claros y modal con fondo oscuro.     |
| **TC-30-02** | Cobro en Caja  | Registrar cobro mixto en modal de pago.             | Campos de efectivo y tarjeta legibles con saldo restante destacado.                |
| **TC-30-03** | Notificaciones | Filtrar notificaciones por `7d` y `30d`.            | Tarjetas con fondos suaves oscuros según su tipo y división sutil.                 |
| **TC-30-04** | Novedades      | Abrir modal de detalle con video embebido.          | Reproductor de video integrado armónicamente en el modal oscuro.                   |
| **TC-30-05** | Reportes       | Pasar el cursor sobre barras de ventas en reportes. | Tooltip emergente oscuro con valores visibles y ejes contrastados.                 |
| **TC-30-06** | Perfil         | Seleccionar tema en la ficha de usuario.            | La interfaz responde inmediatamente reflejando la elección y persiste al recargar. |
