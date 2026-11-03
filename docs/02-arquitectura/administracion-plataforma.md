# Administración de plataforma Torcly

## Propósito

La administración de plataforma es un espacio interno de Torcly, separado de
la operación diaria de cada taller. Su ruta prevista es `/plataforma`; no
reemplaza el dashboard operativo `/dashboard` ni se habilita para miembros de
una organización.

## Protección obligatoria

1. La API valida `isPlatformAdmin` desde la sesión; no desde un rol, cabecera,
   query string ni dato controlado por el navegador.
2. El cliente sólo muestra la navegación de plataforma si la sesión la
   declara, pero la protección real está en cada endpoint del servidor.
3. Un administrador de plataforma no recibe automáticamente contexto de
   organización ni permisos operativos.
4. Toda acción de soporte sobre un tenant exige organización destino, motivo,
   actor, fecha y dirección IP cuando esté disponible, registrados en auditoría.

## Panel inicial

El primer panel tendrá datos administrativos agregados, no el detalle
operativo de un taller:

- Organizaciones: total, activas, suspendidas, fecha de alta y última actividad.
- Membresías: usuarios activos por organización y cuentas sin membresía.
- Salud de plataforma: errores agregados, sesiones y estado de servicios.
- Soporte: historial de accesos delegados y sus motivos.

## Módulos futuros

| Módulo                          | Alcance inicial                                  | No incluido todavía                            |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| Organizaciones                  | Crear, activar/suspender, ver estado y miembros. | Borrado físico automático.                     |
| Membresías                      | Invitar/asignar rol del taller y revocar acceso. | Cambio directo de contraseña de usuarios.      |
| Planes y membresías comerciales | Plan asignado, estado, fechas y límites.         | Cobro recurrente o pasarela de pagos.          |
| Analítica SaaS                  | Conteos y tendencias agregadas por organización. | Exponer clientes, ventas o PII entre talleres. |
| Soporte auditado                | Entrada temporal a una organización con motivo.  | Acceso silencioso o permanente.                |

## Modelo de suscripción previsto

No se implementará facturación hasta acordar el proveedor, pero la estructura
reservará `Plan`, `OrganizationSubscription` y un historial de cambios. La
suscripción pertenece a la organización, no al usuario. Sus límites deben ser
evaluados en servidor (usuarios, técnicos, productos u otros), nunca sólo en
la interfaz.

## Criterios de salida

- Ningún miembro de un taller ve `/plataforma` ni recibe datos de otra
  organización.
- Los datos mostrados son agregados y no revelan PII innecesaria.
- Cada acceso de soporte tiene trazabilidad completa.
- La consola se prueba con una cuenta global sin membresía y dos organizaciones
  independientes.
