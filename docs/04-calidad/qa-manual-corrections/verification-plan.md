# Plan de verificación de correcciones QA

## Preparación

1. Usar una base de desarrollo o QA descartable, con migraciones aplicadas y
   una cuenta administradora autorizada. No usar producción.
2. Anotar rama, commit, fecha, navegador y entorno. No incluir credenciales,
   cookies, tokens ni URLs de base de datos en la evidencia.
3. Crear datos únicos con un sufijo de prueba para no confundirlos con registros
   de demostración.
4. Al terminar cada caso, guardar captura del resultado y, cuando aplique,
   código HTTP y `requestId` sin cuerpos sensibles.

## Casos manuales

| ID    | Pasos                                                                                                                               | Resultado esperado                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| QA-01 | Fallar cinco inicios de sesión con una cuenta auxiliar; revisar Usuarios/Auditoría con administrador.                               | Login conserva mensaje genérico; la vista autorizada confirma el bloqueo y su auditoría sin revelar esa información en login. |
| QA-02 | Desactivar una cuenta auxiliar; cerrar sesión; intentar entrar y revisar Usuarios con administrador.                                | El acceso no crea sesión y sigue respondiendo genéricamente; Usuarios muestra la cuenta existente e inactiva.                 |
| QA-03 | En Cliente jurídico provocar el error de RUC y después ingresar 11 dígitos válidos junto con razón social/teléfono válidos.         | El error rojo desaparece al corregir; el registro se puede enviar una sola vez.                                               |
| QA-04 | Abrir una ruta inexistente de la aplicación.                                                                                        | Se ven `Error 404`, explicación amigable y acción para volver al inicio.                                                      |
| QA-05 | Con nueve vehículos distintos, crear ocho citas `PROGRAMADA` en idéntica fecha y hora; crear una novena. Cancelar una y reintentar. | Ocho aceptadas; novena rechazada por capacidad; al cancelar, solo un cupo queda libre.                                        |
| QA-06 | Crear producto con stock, añadirlo al presupuesto de orden, aprobar, iniciar ejecución, consumir una parte y devolver otra.         | Hay producto seleccionable; se ven consumo y devolución; inventario registra `EXIT` y `ADJUSTMENT_IN` sin duplicados.         |
| QA-07 | En Caja abrir una venta pendiente, reemplazar el importe por `100.00`, elegir método y registrar.                                   | El campo mantiene `100.00` mientras se escribe; el pago parcial persiste y el saldo se actualiza.                             |
| QA-08 | Probar `1`, `1.2`, `1.234` y `1.2345` en los flujos de cantidad.                                                                    | Los tres primeros valores se aceptan; `1.2345` se rechaza sin redondearse ni alterar stock.                                   |

## Regresión automatizada mínima

Ejecutar en la raíz, adaptando solo cuando el proyecto documente un script
equivalente:

```powershell
pnpm --filter @torcly/api typecheck
pnpm --filter @torcly/api lint
pnpm --filter @torcly/api test
pnpm --filter @torcly/web typecheck
pnpm --filter @torcly/web lint
pnpm --filter @torcly/web test
pnpm --filter @torcly/web build
pnpm format:check
git diff --check
```

Las integraciones con PostgreSQL solo se ejecutan contra una base descartable y
autorizada. Si no hay ese entorno, se deja constancia como pendiente; no se
simula una ejecución exitosa.

## Registro de ejecución QA-17

- Fecha: 2026-10-22
- Rama: `feature/qa-manual-corrections`
- Commit base: `33a720b`
- Entorno: Windows, tests unitarios sin PostgreSQL.
- API: typecheck, lint y test correctos (306 aprobadas; 109 integraciones
  omitidas por falta de base).
- Web: typecheck, lint, test (371 aprobadas) y build correctos.
- `pnpm format:check` y `git diff --check` correctos.
- QA-05 quedó cubierto por regresión de integración (omitida) y test unitario
  del repository. QA-06 y QA-07 tienen pruebas de componentes/UI aprobadas.
- Pendiente: ejecutar las integraciones con PostgreSQL descartable y completar
  la validación manual con capturas de los tres casos.

## Registro de ejecución QA-18

- Fecha: 2026-10-22
- Rama: `feature/qa-manual-corrections`
- Commit base: `33a720b`
- Entorno: Windows, tests unitarios sin PostgreSQL.
- QA-03: causa raíz identificada (validación en el cambio de tipo dejaba un
  error de documento obsoleto). Corrección en `customer-form-modal.tsx`
  (`mode: 'onTouched'`, cambio de tipo sin `shouldValidate`); 6 pruebas del modal
  en verde, incluida la que reproducía el defecto.
- QA-04: `code: 'Error 404'` en el preset `not-found` y distintivo visible en
  `SystemFeedbackScreen`; pruebas del componente (11) y del router (2) en verde,
  manteniendo diferenciada la pantalla de error inesperado.
- Web: typecheck, lint, test (375 aprobadas) y build correctos.
- `pnpm format:check` y `git diff --check` correctos.
- Pendiente: validación manual en navegador con capturas de QA-03 y QA-04.

## Registro de ejecución QA-19

- Fecha: 2026-10-23
- Rama: `feature/qa-manual-corrections`
- Commit base: `33a720b`
- Entorno: Windows, tests unitarios sin PostgreSQL.
- QA-01/QA-02: sin cambios en el mensaje de login; se añadieron pruebas de que
  cuentas inactivas, bloqueadas y desconocidas comparten
  `AUTH_INVALID_CREDENTIALS` sin crear sesión, que el bloqueo expirado permite
  entrar y que el repository emite `ACCOUNT_LOCKED`/`LOGIN_FAILURE` según
  corresponda.
- QA-08: validación común de hasta tres decimales en API y web para stock mínimo,
  inventario (inicial, entrada, salida y ajuste), venta, presupuesto de taller,
  consumo y devolución. Los cuatro decimales se rechazan sin redondear; venta y
  presupuesto además rechazan la línea en el momento de agregarla.
- API: typecheck y lint correctos; 52 pruebas específicas de QA-19 aprobadas.
- Web: typecheck, lint y build correctos; 49 pruebas específicas de QA-19
  aprobadas.
- La suite completa de web se inició en modo serial para evitar competencia de
  workers, pero encontró el fallo preexistente e intermitente de Enter en
  `service-form-modal.test.tsx`, fuera del alcance de QA-19. Reintentar la
  suite completa en una ejecución aislada antes del cierre global de QA; el
  archivo fallido sí pasa aislado (5 pruebas).
- Pendiente además: ejecutar `pnpm format:check` y `git diff --check` tras el
  cierre documental.
- Pendiente: validación manual en navegador con capturas de QA-01/QA-02 y
  ejecución de las integraciones con PostgreSQL descartable.
