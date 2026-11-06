# Plan de Pruebas y Criterios de Aceptación — Sprint 28

## 1. Criterios de Aceptación (Definition of Done)

### Funcionalidad de Plataforma
- [ ] El Superadmin de Plataforma puede consultar la lista completa de planes comerciales y suscripciones de organizaciones en `/plataforma/suscripciones`.
- [ ] La tabla permite filtrar por estado (`ACTIVE`, `TRIAL`, `PAST_DUE`, `SUSPENDED`, `CANCELED`) y buscar por nombre o código de taller.
- [ ] El Superadmin puede cambiar el plan de una organización (ej. de `STARTER` a `PRO` o `ENTERPRISE`), reflejándose de inmediato el nuevo límite y fecha de renovación.
- [ ] Las métricas de plataforma muestran con precisión el conteo de suscripciones activas, en prueba y suspendidas.

### Control de Cuotas en Servidor
- [ ] Al intentar agregar un miembro cuando la organización ya alcanzó el límite `maxMembers` de su plan, el servidor rechaza la solicitud con error `409` descriptivo.
- [ ] Al intentar agregar un técnico cuando la organización ya alcanzó el límite `maxTechnicians` de su plan, el servidor rechaza la solicitud con error `409`.
- [ ] Si la suscripción de la organización está en estado `SUSPENDED`, las operaciones de creación de miembros y técnicos son bloqueadas por el servidor.

### Vista del Taller
- [ ] El dueño o administrador del taller puede acceder a `/suscripcion` y observar el plan actual, la vigencia, la próxima renovación y las barras de progreso de cuotas consumidas.
- [ ] La interfaz refleja con claridad el estado del plan con badges de color acordes a la paleta Torcly (Verde menta para `ACTIVE`, Azul para `TRIAL`, Rosa/Rojo para `SUSPENDED`).

---

## 2. Casos de Prueba Automatizados

### Backend (Vitest)
1. `subscriptions.service.test.ts`:
   - Verifica obtención de la suscripción activa con cálculo correcto de métricas de uso (miembros, técnicos, productos).
   - Verifica rechazo por exceder cuota de miembros al invocar validación.
   - Verifica rechazo por exceder cuota de técnicos al invocar validación.
   - Verifica actualización de plan de organización y ajuste de fechas.
2. `subscriptions.schemas.test.ts`:
   - Valida esquemas Zod de consulta y actualización de suscripción.

### Frontend (Vitest + React Testing Library)
1. `platform-subscriptions-page.test.tsx`:
   - Renderiza la tabla de suscripciones y tarjetas de métricas.
   - Permite abrir el modal de cambio de plan y enviar la actualización.
2. `subscription-page.test.tsx`:
   - Renderiza la ficha de suscripción del taller con las barras de consumo y badges de estado.

---

## 3. Pruebas Manuales E2E
1. Iniciar sesión como Superadmin de Plataforma (`platform.admin@torcly.com` o similar).
2. Ingresar a `/plataforma/suscripciones` desde el sidebar.
3. Verificar visualización de las suscripciones existentes con sus métricas.
4. Cambiar el plan de un taller de prueba a `STARTER` (límite 3 miembros).
5. Cambiar de contexto al taller de prueba y verificar en `/suscripcion` que las cuotas muestran el nuevo límite.
6. Intentar crear un cuarto miembro en el taller y comprobar que el sistema bloquea la acción indicando que se alcanzó el límite del plan.
