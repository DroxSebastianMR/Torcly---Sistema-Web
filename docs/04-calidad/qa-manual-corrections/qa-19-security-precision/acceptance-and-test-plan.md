# Plan de aceptación - QA-19 Seguridad y precisión

## QA-01 - Bloqueo temporal

1. Usar una cuenta auxiliar, nunca administrador.
2. Fallar cinco accesos y comprobar que login no revela identidad, estado ni
   duración del bloqueo.
3. Con administrador, comprobar en Usuarios/Auditoría el bloqueo y evento.

Esperado: no se crea sesión; evidencia administrativa protegida confirma el
bloqueo. No se guardan ni comparten contraseñas.

## QA-02 - Cuenta desactivada

1. Desactivar una cuenta auxiliar desde Usuarios.
2. Cerrar sesión e intentar entrar con la cuenta.
3. Revisar el estado desde Usuarios con administrador.

Esperado: no hay sesión; login conserva respuesta genérica; administración
muestra el usuario existente e inactivo.

## QA-08 - Precisión de cantidades

1. En producto, stock inicial, entrada, salida, ajuste, venta, presupuesto,
   consumo y devolución probar `1`, `1.2`, `1.234` y `1.2345`.
2. Verificar web y API, no solo el control visible.

Esperado: se aceptan hasta tres decimales y se rechaza el cuarto decimal sin
redondear, persistir ni modificar saldos o stock.
