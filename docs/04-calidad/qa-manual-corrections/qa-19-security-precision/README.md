# QA-19 - Seguridad y precisión de datos

Rama: `feature/qa-manual-corrections`  
Estado: Implementado; validación manual y con PostgreSQL pendientes  
Origen: QA-01, QA-02 y QA-08 de la prueba manual.

## Objetivo

Validar de forma segura bloqueo e inactivación de usuarios y acordar una política
coherente de precisión por unidad antes de cambiar cantidades dependientes.

## Alcance

| ID    | Entrega                                                                         |
| ----- | ------------------------------------------------------------------------------- |
| QA-01 | Evidencia de bloqueo temporal no enumerativa por cinco fallos.                  |
| QA-02 | Evidencia de rechazo de cuenta inactiva y estado visible solo a administración. |
| QA-08 | Validación consistente de hasta tres decimales para cualquier cantidad.         |

## Límite de seguridad

El login seguirá respondiendo de forma uniforme. Nunca mostrará a una persona no
autenticada si una cuenta existe, está inactiva/bloqueada o cuánto tiempo queda
para desbloquearse.

## Política aprobada QA-08

Toda cantidad, incluida `und`, admite hasta tres decimales. Los valores con
cuatro o más decimales deben rechazarse en web y API, sin redondeo silencioso.
La base ya utiliza `Decimal(12,3)`, por lo que no requiere migración.

Usar [implementation-prompt.md](implementation-prompt.md) y
[acceptance-and-test-plan.md](acceptance-and-test-plan.md) para implementar y
validar.

## Resultados de implementación

- QA-01/QA-02: el login conserva la respuesta genérica
  `AUTH_INVALID_CREDENTIALS` para credenciales desconocidas, cuentas inactivas y
  cuentas bloqueadas, sin crear sesión ni revelar estado o tiempo restante.
  `auth.service.test.ts` cubre la uniformidad del rechazo y que un bloqueo
  expirado permite iniciar sesión. El nuevo `auth.repository.test.ts` verifica
  que el quinto fallo persiste `lockedUntil`, emite `ACCOUNT_LOCKED` y que el
  rechazo de una cuenta inactiva emite `LOGIN_FAILURE` sin sesión.
- QA-08: helper compartido `hasAtMostThreeDecimals` en API y web, aplicado a
  stock mínimo de producto, stock inicial, entrada, salida, ajuste, ventas,
  presupuesto de taller, consumo y devolución. Los valores con cuatro decimales
  se rechazan sin redondear. En venta y presupuesto el rechazo es inmediato al
  agregar o editar la línea; consumo y devolución lo validan antes de enviar.
- Verificación actual: API typecheck y lint correctos, con 52 pruebas
  específicas de QA-19 aprobadas. Web typecheck, lint y build correctos, con
  49 pruebas específicas de QA-19 aprobadas. La suite completa de web debe
  reintentarse sin carga concurrente: la reejecución serial se detuvo al
  encontrar el caso preexistente e intermitente de Enter en
  `service-form-modal.test.tsx`, ajeno a QA-19; ese archivo sí pasa aislado
  (5 pruebas).
- Pendiente: validación manual en navegador con capturas de QA-01/QA-02 y
  ejecución de las integraciones con PostgreSQL descartable. La aprobación del
  paquete corresponde a una persona autorizada.
